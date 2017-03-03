var cadence = require('cadence')
var abend = require('abend')

var Response = require('nascent.rendezvous/response')

// Container for Sencha Connect middleware.
var Interlocutor = require('interlocutor')

var coalesce = require('nascent.coalesce')

var Operation = require('operation/redux')
var Multiplexer = require('conduit/multiplexer')
var Destructor = require('destructible')
var assert = require('assert')
var Destructor = require('destructible')

function Subordinate (options) {
    this._multiplexer = null
    this._destructor = new Destructor
    this._interlocutor = new Interlocutor(options.middleware)
    this._userConnect = options.connect
}

Subordinate.prototype.listen = function (program) {
    program.on('message', Operation({ object: this, method: '_message' }))
}

Subordinate.prototype._message = function (message, socket) {
    if (message.middleware) {
        assert(this._multiplexer == null)
        var multiplexer = new Multiplexer(socket, socket, { object: this, method: '_connect' })
        this._multiplexer = multiplexer
        this._destructor.destructible(cadence(function (async) {
            multiplexer.listen(async())
        }), abend)
    } else {
        var buffer = new Buffer(message.buffer, 'base64')
        this._userConnect.call(null, message.body, socket, buffer)
    }
}

Subordinate.prototype._connect = cadence(function (async, socket, envelope) {
    new Response(this._interlocutor, socket, envelope).respond(async())
})

Subordinate.prototype.reassign = function () {
    var vargs = Array.prototype.slice.call(arguments), index = -1
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
    process.send({
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
