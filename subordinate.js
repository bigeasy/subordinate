var cadence = require('cadence')
var abend = require('abend')

var Response = require('nascent.rendezvous/response')

// Container for Sencha Connect middleware.
var Interlocutor = require('interlocutor')

var coalesce = require('nascent.coalesce')

var Operation = require('operation/redux')
var Destructor = require('destructible')
var assert = require('assert')
var Destructor = require('destructible')

var Conduit = require('conduit')
var Server = require('conduit/server')

function Subordinate (options) {
    this._conduit = null
    this._destructor = new Destructor
    this._interlocutor = new Interlocutor(options.middleware)
    this._userConnect = options.connect
}

Subordinate.prototype.listen = function (program) {
    program.on('message', Operation({ object: this, method: '_message' }))
}

Subordinate.prototype._message = function (message, socket) {
    if (message.middleware) {
        assert(this._conduit == null)
        var conduit = this._conduit = new Conduit(socket, socket)
        new Server({ object: this, method: '_connect' }, 'subordinate', conduit.read, conduit.write)
        this._destructor.addDestructor('conduit', conduit.destroy.bind(conduit))
        this._destructor.destructible(cadence(function (async) {
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
