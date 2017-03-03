// From the Node.js API.
var url = require('url')

// Common utilities.
var coalesce = require('nascent.coalesce')

// Control-flow utilities.
var abend = require('abend')
var cadence = require('cadence')

// FNV hash for distribution.
var fnv = require('hash.fnv')

// Closes all open sockets so that the HTTP server close.
var destroyer = require('server-destroy')

var cluster = require('cluster')
var children = require('child_process')
var crypto = require('crypto')
var Destructor = require('destructible')
var http = require('http')
var interrupt = require('interrupt').createInterrupter('subordinate')
var coalesce = require('nascent.coalesce')
var Operation = require('operation/redux')
var destroyer = require('server-destroy')
var Request = require('nascent.rendezvous/request')

var Multiplexer = require('conduit/multiplexer')

var Downgrader = require('downgrader')
Downgrader.Socket = require('downgrader/socket')

function Cluster (program) {
    this.isMaster = cluster.isMaster
    this._secret = coalesce(program.env.SUBORDINATE_SECRET),
    this._listenerCount = coalesce(program.ultimate.listeners, 1)
    this._listeners = []
    this._workerCount = coalesce(program.ultimate.workers, 1)
    this._workers = []
    this._clients = []
    this._middleware = null
    this._keys = program.grouped.key.map(function (key) {
        if (~key.indexOf('$')) {
            return new Function('$', 'return ' + key)
        } else {
            return require(key)
        }
    })
    this._destructor = new Destructor('subordinate')
    this._destructor.markDestroyed(this, 'destroyed')
    this._destructor.addDestructor('kill', { object: this, method: '_kill' })
    this._argv = program.argv.slice()
    this._command = this._argv.shift()
    this._bind = program.ultimate.bind
}

Cluster.prototype.destroy = function () {
    this._destructor.destroy()
}

Cluster.prototype._kill = function () {
    this._listeners.forEach(function (listener) { listener.kill() })
    this._workers.forEach(function (worker) { worker.worker.kill() })
}

Cluster.prototype.run = cadence(function (async) {
    async(function () {
        if (cluster.isMaster) {
            async(function () {
                crypto.randomBytes(256, async())
            }, function (buffer) {
                this._secret = buffer.toString('hex')
            })
        }
    }, function () {
        if (cluster.isMaster && this._workerCount > 1) {
            for (var i = 0; i < this._workerCount; i++) {
                // TODO What else do you need to set?
                var worker = children.spawn(this._command, this._argv, {
                    stdio: [ 'inherit', 'inherit', 'inherit', 'ipc' ]
                })
                worker.on('message', Operation({ object: this, method: '_message' }))
                this._workers.push({
                    worker: worker,
                    destructor: new Destructor('worker ' + i),
                    index: i // useful?
                })
                worker.on('exit', function (code, signal) {
                    interrupt.assert(code == 0 || signal == 'SIGTERM', 'workerExit', { code: code, signal: signal })
                })
            }
        }
        if (cluster.isMaster && this._listenerCount > 1) {
            var listeners = []
            for (var i = 0; i < this._listenerCount; i++) {
                listeners.push(cluster.fork({ SUBORDINATE_SECRET: this._secret }))
            }
            cluster.on('exit', function (code, signal) {
                interrupt.assert(code == 0, 'listener error exit')
            })
        } else {
            var downgrader = new Downgrader
            downgrader.on('socket', Operation({ object: this, method: '_socket' }))
            var server = http.createServer(Operation({ object: this, method: '_request' }))
            destroyer(server)
            this._destructor.addDestructor('http', server.destroy.bind(server))
            server.on('upgrade', Operation({ object: downgrader, method: 'upgrade' }))
            if (typeof this._bind == 'string') {
                server.listen(this._bind, async())
            } else {
                server.listen(this._bind.port, this._bind.address, async())
            }
        }
    })
})

Cluster.prototype._message = function (message, socket) {
    if (message.index) {
        this._workers[message.index].worker.send(message, socket)
    } else {
        throw new Error
    }
}

// Hash out the correct worker for a given request.
Cluster.prototype._distribute = function (request) {
    var key = JSON.stringify(this._keys.map(function (f) {
        var parsed = url.parse(request.url)
        return coalesce(f({
            headers: request.headers,
            url: request.url,
            parsed: parsed,
            query: url.parse(request.url, true).query,
            parts: parsed.pathname.split('/').splice(1)
        }))
    }))
    var buffer = new Buffer(key)
    var hash = fnv(0, key, 0, key.length)
    var index = hash % this._workers.length
    return { key: key, hash: hash, index: index }
}

Cluster.prototype._proxy = cadence(function (async, request, response) {
    var distrubution = this._distribute(request)
    async(function () {
        if (this._clients[distrubution.index] == null) {
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
                var client = {
                    destructor: new Destructor,
                    multiplexer: new Multiplexer(socket, socket)
                }
                client.destructor.addDestructor('socket', socket.destroy.bind(socket))
                client.destructor.addDestructor('multiplexer', client.multiplexer.destroy.bind(client.multiplexer))
                // TODO Reconsider use of Destructor.
                // TODO Socket on error calls destructor, you got it almost
                // right in Rendezvous.
                client.destructor.destructible(cadence(function (async) {
                    client.multiplexer.listen(async())
                }), abend)

                this._clients[distrubution.index] = client
            })
        }
    }, function () {
        var client = this._clients[distrubution.index]
        new Request(client.multiplexer, request, response, function (header) {
            header.addHTTPHeader('x-subordinate-key', distrubution.key)
            header.addHTTPHeader('x-subordinate-hash', distrubution.hash)
            header.addHTTPHeader('x-subordinate-index', distrubution.index)
        }).consume(async())
    })
})

Cluster.prototype._request = function (request, response) {
    this._proxy(request, response, abend)
}

Cluster.prototype._socket = function (request, socket) {
    var middleware = request.headers['x-subordinate-secret'] == this._secret
    var message = {
        module: 'subordinate',
        method: 'socket',
        middleware: middleware,
        body: {
            httpVersion: request.httpVersion,
            headers: request.headers,
            url: request.url,
            method: request.method,
            rawHeaders: coalesce(request.rawHeaders, [])
        }
    }
    var message
    if (middleware) {
        message = {
            module: 'subordinate',
            method: 'socket',
            middleware: true,
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
        var distribution = this._distribute(request)
        request.headers['x-subordinate-key'] = distribution.key
        request.headers['x-subordinate-hash'] = distribution.hash
        request.headers['x-subordinate-index'] = distribution.index
        message = {
            module: 'subordinate',
            method: 'socket',
            middleware: false,
            index: distribution.index,
            buffer: '',
            body: request
        }
    }
    this._workers[message.index].worker.send(message, socket)
}

module.exports = Cluster
