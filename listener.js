// Control-flow libraries.
var cadence = require('cadence')

// Networking.
var http = require('http')

// User specified callback wrapper.
var Operation = require('operation/variadic')

// Convert an HTTP request into a raw socket.
var Downgrader = require('downgrader')
Downgrader.Socket = require('downgrader/socket')

// Controlled demolition of objects.
var Destructible = require('destructible')

// Closes all open sockets so that the HTTP server close.
var destroyer = require('server-destroy')

function Worker (bind, secret, parent) {
    this._destructible = new Destructible('worker')
    this._bind = bind
    this._secret = secret
    this._parent = parent
}

Worker.prototype._socket = function (request, socket) {
    var middleware = request.headers['x-subordinate-middleware'] == this._secret
    var message
    if (middleware) {
        message = {
            module: 'subordinate',
            method: 'middleware',
            index: +request.headers['x-subordinate-index'],
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
            var distribution = this._distributor.distribute(request)
            request.headers['x-subordinate-key'] = distribution.key
            request.headers['x-subordinate-hash'] = distribution.hash
            request.headers['x-subordinate-index'] = distribution.index
            request.headers['x-subordinate-listener-index'] = this._index
            request.headers['x-subordinate-workers'] = this._workerCount
            request.headers['x-subordinate-secret'] = this._secret
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

Worker.prototype._proxy = cadence(function (async, request, response) {
    var distrubution = this._distributor.distribute(request)
    async(function () {
        if (this._clients[distrubution.index] == null) {
            console.log('CREATING CONDUIT', distrubution)
            var client = this._clients[distrubution.index] = {
                destructor: new Destructor,
                conduit: null,
                client: null,
                initialized: new Signal
            }
            async(function () {
                var connect = {
                    secure: false,
                    host: '127.0.0.1',
                    port: this._bind.port,
                    socketPath: this._bind,
                    headers: {
                        'x-subordinate-secret': this._secret,
                        'x-subordinate-index': distrubution.index
                    }
                }
                if (typeof connect.socketPath == 'string') {
                    delete connect.host
                    delete connect.port
                } else {
                    delete connect.socketPath
                }
                Downgrader.Socket.connect(connect, async())
            }, function (request, socket, head) {
                console.log('DOWNGRADE CONDUIT', request.headers, distrubution)
                var readable = new Staccato.Readable(socket)
                async(function () {
                    readable.read(async())
                }, function (buffer) {
                    console.log('READ CONDUIT', request.headers, distrubution, buffer.toJSON())
                    assert(buffer.toString('hex'), 'aaaaaaaa', 'failed to start middleware')
                    readable.destroy()
                    var conduit = new Conduit(socket, socket)
                    client.conduit = conduit
                    client.destructor.addDestructor('socket', socket.destroy.bind(socket))
                    client.destructor.addDestructor('conduit', client.conduit.destroy.bind(client.conduit))
                    // TODO Reconsider use of Destructor.
                    // TODO Socket on error calls destructor, you got it almost
                    // right in Rendezvous.
                    client.destructor.destructible(cadence(function (async) {
                        client.conduit.listen(async())
                    }), abend)

                    client.client = new Client('subordinate', conduit.read, conduit.write)

                    client.initialized.unlatch()
                })
            })
        } else if (this._clients[distrubution.index].client == null) {
            console.log('WAIT FOR CONDUIT', distrubution)
            this._clients[distrubution.index].initialized.wait(async())
        }
    }, function () {
        var client = this._clients[distrubution.index]
        new Request(client.client, request, response, function (header) {
            header.addHTTPHeader('x-subordinate-key', distrubution.key)
            header.addHTTPHeader('x-subordinate-hash', distrubution.hash)
            header.addHTTPHeader('x-subordinate-index', distrubution.index)
            header.addHTTPHeader('x-subordinate-listener-index', this._index)
            header.addHTTPHeader('x-subordinate-workers', this._workers)
            header.addHTTPHeader('x-subordinate-secret', this._secret)
        }.bind(this)).consume(async())
    })
})

Worker.prototype._request = function (request, response) {
    this._proxy(request, response, function (error) {
        if (typeof error == 'number') {
            var message = new Buffer(http.STATUS_CODES[error])
            response.writeHead(error, http.STATUS_CODES[error], {
                'content-type': 'text/plain',
                'contnet-length': String(message.length)
            })
            response.write(message)
            response.end()
        } else {
            abend(error)
        }
    })
}

Worker.prototype.run = cadence(function (async) {
    var downgrader = new Downgrader
    downgrader.on('socket', Operation([ this, '_socket' ]))

    var server = http.createServer(Operation([ this, '_request' ]))
    destroyer(server)

    this._destructible.addDestructor('http', server.destroy.bind(server))
    server.on('upgrade', Operation([ downgrader, 'upgrade' ]))
    this._bind.listen(server, async())
})

module.exports = Worker
