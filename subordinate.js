var cadence = require('cadence')
var abend = require('abend')

var Response = require('nascent.rendezvous/response')

// Container for Sencha Connect middleware.
var Interlocutor = require('interlocutor')

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
        this._userConnect.call(null, message, socket)
    }
}

Subordinate.prototype._connect = cadence(function (async, socket, envelope) {
    new Response(this._interlocutor, socket, envelope).respond(async())
})

module.exports = Subordinate
