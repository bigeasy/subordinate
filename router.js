// Node.js API.
var http = require('http')
var stream = require('stream')

// Control-flow libraries.
var cadence = require('cadence')
var Signal = require('signal')
var delta = require('delta')
var abend = require('abend')

// Read and write streams with error-first callbacks.
var Staccato = require('staccato')

// Contextualized callbacks and event handlers.
var Operation = require('operation/variadic')

// Convert an HTTP request into a raw socket.
var Downgrader = require('downgrader')

// Controlled demolition of objects.
var Destructible = require('destructible')

// Exceptions that you can catch by type.
var interrupt = require('interrupt').createInterrupter('subordinate')

// Convert thrown integers into HTTP error codes.
var errorify = require('./errorify')

// Evented multiplexing of Node.js streams.
var Conduit = require('conduit')
Conduit.Client = require('conduit/client')

// Proxy HTTP requests over a multiplexed stream.
var Assignation = { Request: require('assignation/request') }

function Router (options) {
    this._destructible = new Destructible('worker')
    this._proxies = {}
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
            from: +request.headers['x-subordinate-from'],
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
        this._distributor.distribute(request).setHeaders(function (name, value) {
            request.headers[name] = value
        })
        message = {
            module: 'subordinate',
            method: 'socket',
            index: +request.headers['x-subordinate-index'],
            buffer: '',
            body: request
        }
    }
    // TODO Why pause?
    socket.pause()
    this._parent.send(message, socket)
}

Router.prototype._proxy = cadence(function (async, request, response) {
    var distribution = this._distributor.distribute(request)
    async(function () {
        if (this._proxies[distribution.index] == null) {
            var proxy = this._proxies[distribution.index] = {
                destructible: new Destructible,
                conduit: null,
                client: null,
                initialized: new Signal
            }
            this._destructible.addDestructor([ 'proxy', distribution.index ], proxy.destructible, 'destroy')
            async(function () {
                var headers = {
                    'x-subordinate-is-middleware': this._distributor.secret,
                }
                distribution.setHeaders(function (name, value) {
                    headers[name] = value
                })
                var connect = this._bind.connect({
                    secure: false,
                    headers: Downgrader.headers(headers)
                })
                var request = http.request(connect)
                delta(async()).ee(request).on('upgrade')
                request.end()
            }, function (request, socket, head) {
                var through = new stream.PassThrough
                var readable = new Staccato.Readable(through)
                async(function () {
                    readable.read(async())
                    through.write(head)
                    socket.pipe(through)
                }, function (buffer) {
                    socket.unpipe(through)
                    interrupt.assert(buffer.toString('hex'), 'aaaaaaaa', 'failed to start middleware')
                    readable.destroy()
                    proxy.client = new Conduit.Client
                    var conduit = new Conduit(socket, socket, proxy.client)
                    proxy.conduit = conduit
                    proxy.destructible.addDestructor('closeify', function () {
                        console.log('DESTROYED ->', socket.localAddress + ':' + socket.localPort)
                    })
                    proxy.destructible.addDestructor('socket', socket, 'destroy')
                    proxy.destructible.addDestructor('conduit', proxy.conduit, 'destroy')
                    // TODO Reconsider use of Destructible.
                    // TODO Socket on error calls destructible, you got it
                    // almost right in Rendezvous.
                    proxy.conduit.listen(null, this._destructible.monitor([ 'proxy', distribution.index ]))

                    proxy.initialized.unlatch()
                })
            })
        }
    }, function () {
        this._proxies[distribution.index].initialized.wait(async())
    }, function () {
        var proxy = this._proxies[distribution.index]
        var router = this
        new Assignation.Request(proxy.client, request, response, function (header) {
            distribution.setHeaders(function (name, value) {
                header.addHTTPHeader(name, value)
            })
        }).consume(async())
    })
})

Router.prototype.message = function (message) {
    if (message.module == 'subordinate' && message.method == 'shutdown') {
        this._destructible.destroy()
    }
}

Router.prototype._request = function (request, response) {
    this._proxy(request, response, errorify(response, abend))
}

Router.prototype.run = cadence(function (async) {
    var connections = {}
    var downgrader = new Downgrader
    downgrader.on('socket', Operation([ this, '_socket' ]))

    var server = http.createServer(Operation([ this, '_request' ]))

    this._destructible.addDestructor('disconnect', require('./disconnector')(require('cluster').worker, server))

    server.on('upgrade', Operation([ downgrader, 'upgrade' ]))

    // TODO Account for relocated connections.
    server.on('connection', function (socket) {
        var key = socket.remoteAddress + ':' + socket.remotePort
        connections[key] = socket
        socket.on('close', function () {
            delete connections[key]
        })
    })
    this._destructible.addDestructor('http', function () {
        for (var key in connections) {
            connections[key].destroy()
        }
    })

    cadence(function (async) {
        async(function () {
            this._bind.listen(server, async())
        }, function () {
            delta(async()).ee(server).on('close')
            this.ready.unlatch()
        }, function () {
            console.log('CLOSEIFY')
        })
    }).call(this, this._destructible.monitor('server'))

    this._destructible.completed(5000, async())
})

module.exports = Router
