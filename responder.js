// Control-flow libraries.
var cadence = require('cadence')
var Signal = require('signal')

// Read and write streams with error-first callbacks.
var Staccato = require('staccato')

// Exceptions that you can catch by type.
var interrupt = require('interrupt').createInterrupter('subordinate')

// Evented multiplexing of Node.js streams.
var Conduit = require('conduit')
Conduit.Server = require('conduit/server')

// Proxy HTTP requests over a multiplexed stream.
var Assignation = { Response: require('assignation/response') }

// Controlled demolition of objects.
var Destructible = require('destructible')

function Responder (interlocutor) {
    this._interlocutor = interlocutor
    this._destructible = new Destructible('responder')
    this.ready = new Signal
}

Responder.prototype.listen = cadence(function (async, socket) {
    var readable = new Staccato.Readable(socket)
    async(function () {
        readable.read(async())
    }, function (buffer) {
        interrupt.assert(buffer.toString('hex') == 'aaaaaaaa', 'invalid middleware handshake')
        this._destructible.monitor(async, 'listen')(function (ready) {
            var conduit = new Conduit(socket, socket)
            new Conduit.Server({ object: this, method: '_request' }, 'subordinate', conduit.read, conduit.write)
            this._destructible.addDestructor('conduit', conduit, 'destroy')
            conduit.listen(async())
            ready.unlatch()
        })
        this._destructible.rescue(async)(function () {
            socket.write(new Buffer([ 0xaa, 0xaa, 0xaa, 0xaa ]), async())
        })
        this._destructible.ready.wait(this.ready, 'unlatch')
    })
})

Responder.prototype._request = function (socket, envelope) {
    new Assignation.Response(this._interlocutor, socket, envelope).respond(this._destructible.rescue('request'))
}

Responder.prototype.destroy = function () {
    this._destructible.destroy()
}

module.exports = Responder
