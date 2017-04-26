// From the Node.js API.
var assert = require('assert')
var url = require('url')
var cluster = require('cluster')
var children = require('child_process')
var http = require('http')
var Signal = require('signal')

// Common utilities.
var coalesce = require('extant')

// Control-flow utilities.
var abend = require('abend')
var cadence = require('cadence')

// FNV hash for distribution.
var fnv = require('hash.fnv')

// Closes all open sockets so that the HTTP server close.
var destroyer = require('server-destroy')

// Controlled demolition of objects.
var Destructor = require('destructible')

// Exceptions that you can catch by type.
var interrupt = require('interrupt').createInterrupter('subordinate')
var Operation = require('operation/redux')
var destroyer = require('server-destroy')
var Request = require('assignation/request')

var Conduit = require('conduit')
var Client = require('conduit/client')

var Staccato = require('staccato')

var Downgrader = require('downgrader')
Downgrader.Socket = require('downgrader/socket')

var Distributor = require('./distributor')

function Cluster (program, secret) {
    this.isMaster = cluster.isMaster
    this._secret = secret
    this._listenerCount = coalesce(program.ultimate.listeners, 1)
    this._listeners = []
    this._workerCount = coalesce(program.ultimate.workers, 1)
    this._workers = []
    this._clients = []
    this._middleware = null
    this._distributor = new Distributor(this._secret, this._workerCount, program.grouped.key)
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

Cluster.prototype._startWorker = function (index) {
    // TODO What else do you need to set?
    var worker = children.spawn(this._command, this._argv, {
        stdio: [ 'inherit', 'inherit', 'inherit', 'ipc' ]
    })
    worker.on('message', Operation({ object: this, method: '_message' }))
    this._workers[index] = {
        worker: worker,
        destructor: new Destructor('worker ' + index),
        index: index // useful?
    }
    worker.on('exit', function (code, signal) {
        interrupt.assert(code == 0 || signal == 'SIGTERM', 'workerExit', { code: code, signal: signal })
    })
}

Cluster.prototype.run = cadence(function (async) {
    async(function () {
        if (cluster.isMaster && this._workerCount > 1) {
            for (var i = 0; i < this._workerCount; i++) {
                this._startWorker(i)
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

Cluster.prototype._proxy = cadence(function (async, request, response) {
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
            header.addHTTPHeader('x-subordinate-workers', this._workerCount)
            header.addHTTPHeader('x-subordinate-secret', this._secret)
        }.bind(this)).consume(async())
    })
})

Cluster.prototype._request = function (request, response) {
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
        if (this._workerCount != 0) {
            var distribution = this._distributor.distribute(request)
            request.headers['x-subordinate-key'] = distribution.key
            request.headers['x-subordinate-hash'] = distribution.hash
            request.headers['x-subordinate-index'] = distribution.index
            request.headers['x-subordinate-workers'] = this._workerCount
            request.headers['x-subordinate-secret'] = this._secret
        }
        message = {
            module: 'subordinate',
            method: 'socket',
            middleware: false,
            index: +request.headers['x-subordinate-index'],
            buffer: '',
            body: request
        }
    }
    if (this._workerCount == 0 && this._workers[message.index] == null) {
        this._startWorker(message.index)
    }
    this._workers[message.index].worker.send(message, socket)
}

module.exports = Cluster
