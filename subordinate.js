// Node.js API.
var assert = require('assert')

// Control-flow utilites.
var cadence = require('cadence')
var abend = require('abend')

// Proxy an HTTP request over socket dedicated to Conduit.
var Response = require('assignation/response')

// Container for Sencha Connect middleware.
var Interlocutor = require('interlocutor')

// Return the first not null-like value.
var coalesce = require('extant')

// Contextualized callbacks and event handlers.
var Operation = require('operation/redux')

// Controlled demolition of objects.
var Destructible = require('destructible')

// Raw-socket multiplexing and network patterns.
var Conduit = require('conduit')
var Server = require('conduit/server')

// Construct a `Subordinate` with Sencha Connect middleware and an optional

//
function Subordinate (options) {
    this._conduit = null
    this._process = coalesce(options.process, process)
    this._destructible = new Destructible
    this._interlocutor = new Interlocutor(options.middleware)
    this._userConnect = coalesce(options.connect)
    this._process.on('message', Operation({ object: this, method: '_message' }))
}

Subordinate.prototype._message = function (message, socket) {
    if (message.middleware) {
        socket.write(new Buffer([ 0xaa, 0xaa, 0xaa, 0xaa ]))
        assert(this._conduit == null)
        var conduit = this._conduit = new Conduit(socket, socket)
        new Server({ object: this, method: '_connect' }, 'subordinate', conduit.read, conduit.write)
        this._destructible.addDestructor('conduit', conduit, 'destroy')
        this._destructible.destructible(cadence(function (async) {
            conduit.listen(async())
        }), abend)
    } else {
        var buffer = new Buffer(message.buffer, 'base64')
        this._userConnect.call(null, message.body, socket, buffer)
    }
}

Subordinate.prototype._connect = function (socket, envelope) {
    new Response(this._interlocutor, socket, envelope).respond(abend)
}

Subordinate.prototype.reassign = function () {
    var vargs = Array.prototype.slice.call(arguments), index = null
    if (typeof vargs[0] == 'number') {
        index = vargs.shift()
    }
    var request = vargs.shift()
    var socket = vargs.shift()
    var buffer = coalesce(vargs.shift(), new Buffer(0))
    // The user can only send stuff that would fit in the headers of an HTTP
    // reqeust. If they have structured data, they can serialize to JSON and use
    // a request header. If they have binary data they can serialize to base 64
    // and use a request header. This does not accommodate a lot of data. It
    // shouldn't. It's going to go through `process.send`, after all.
    this._process.send({
        module: 'subordinate',
        method: 'socket',
        index: index,
        buffer: buffer.toString('base64'),
        body: {
            httpVersion: request.httpVersion,
            headers: request.headers,
            url: request.url,
            method: request.method,
            rawHeaders: coalesce(request.rawHeaders, [])
        }
    }, socket)
}


module.exports = Subordinate
