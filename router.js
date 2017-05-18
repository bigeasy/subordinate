// Node.js API.
var http = require('http')

// Control-flow libraries.
var cadence = require('cadence')
var Signal = require('signal')
var delta = require('delta')

// Contextualized callbacks and event handlers.
var Operation = require('operation/variadic')

// Convert an HTTP request into a raw socket.
var Downgrader = require('downgrader')
Downgrader.Socket = require('downgrader/socket')

// Controlled demolition of objects.
var Destructible = require('destructible')

// Closes all open sockets so that the HTTP server close.
var destroyer = require('server-destroy')

function Router (options) {
    this._destructible = new Destructible('worker')
    this._bind = options.bind
    this._parent = options.parent
    this._distributor = options.distributor
    this.ready = new Signal
}

Router.prototype._socket = function (request, socket) {
    var message
    var middleware = request.headers['x-subordinate-is-middleware'] == this._distributor.secret
    if (middleware) {
        message = {
            module: 'subordinate',
            method: 'middleware',
            from: +request.headers['x-subordinate-router-index'],
            to: +request.headers['x-subordinate-index'],
            buffer: '',
            body: null
        }
    } else {
        // TODO I'm dealing with `rawHeaders` a lot, should create more helpers.
        // TODO Come back and add `rawHeaders.
        var request = {
            httpVersion: request.httpVersion,
            headers: JSON.parse(JSON.stringify(request.headers)),
            url: request.url,
            method: request.method
        }
        if (this._workerCount != 0) {
            this._distributor.distribute(request).setHeaders(function (name, value) {
                request.headers[name] = value
            })
        }
        message = {
            module: 'subordinate',
            method: 'socket',
            index: +request.headers['x-subordinate-index'],
            buffer: '',
            body: request
        }
    }
    this._parent.send(message, socket)
}

Router.prototype._proxy = cadence(function (async, request, response) {
    var distribution = this._distributor.distribute(request)
    async(function () {
        if (this._clients[distribution.index] == null) {
            var client = this._clients[distribution.index] = {
                destructible: new Destructible,
                conduit: null,
                client: null,
                initialized: new Signal
            }
            async(function () {
                var connect = this._bind.connect({
                    secure: false,
                    headers: {
                        'x-subordinate-is-middleware': this._secret,
                        'x-subordinate-index': distribution.index,
                        'x-subordinate-from': request.headers['x-subordinate-index']
                    }
                })
                Downgrader.Socket.connect(connect, async())
            }, function (request, socket, head) {
                var readable = new Staccato.Readable(socket)
                async(function () {
                    readable.read(async())
                }, function (buffer) {
                    assert(buffer.toString('hex'), 'aaaaaaaa', 'failed to start middleware')
                    readable.destroy()
                    var conduit = new Conduit(socket, socket)
                    client.conduit = conduit
                    client.destructible.addDestructor('socket', socket.destroy.bind(socket))
                    client.destructible.addDestructor('conduit', client.conduit.destroy.bind(client.conduit))
                    // TODO Reconsider use of Destructible.
                    // TODO Socket on error calls destructible, you got it
                    // almost right in Rendezvous.
                    client.destructor.destructible(function (ready, callback) {
                        client.conduit.listen(callback)
                        ready.unlatch()
                    }, abend)

                    client.client = new Client('subordinate', conduit.read, conduit.write)

                    client.initialized.unlatch()
                })
            })
        } else if (this._clients[distribution.index].client == null) {
            this._clients[distribution.index].initialized.wait(async())
        }
    }, function () {
        var client = this._clients[distribution.index]
        var router = this
        new Request(client.client, request, response, function (header) {
            distribution.setHeaders(function (name, value) {
                header.addHTTPHeader(name, value)
            })
        }).consume(async())
    })
})

Router.prototype._request = function (request, response) {
    this._proxy(request, response, function (error) {
        if (typeof error == 'number') {
            var message = new Buffer(http.STATUS_CODES[error])
            response.writeHead(error, http.STATUS_CODES[error], {
                'content-type': 'text/plain',
                'contnet-length': String(message.length)
            })
            response.end(message)
        } else {
            abend(error)
        }
    })
}

Router.prototype.run = cadence(function (async) {
    var downgrader = new Downgrader
    downgrader.on('socket', Operation([ this, '_socket' ]))

    var server = http.createServer(Operation([ this, '_request' ]))
    destroyer(server)

    this._destructible.addDestructor('http', server.destroy.bind(server))
    server.on('upgrade', Operation([ downgrader, 'upgrade' ]))
    this._destructible.stack(async, 'server')(function (ready) {
        async(function () {
            this._bind.listen(server, async())
        }, function () {
            delta(async()).ee(server).on('close')
            ready.unlatch()
        })
    })

    this._destructible.ready.wait(this.ready, 'unlatch')
})

Router.prototype.destroy = function () {
    this._destructible.destroy()
}

module.exports = Router
