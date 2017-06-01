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

// Create a cancelable series of function invocations.
var Thereafter = require('thereafter')

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
        var thereafter = new Thereafter
        this._destructible.addDestructor('thereafter', thereafter, 'cancel')
        thereafter.run(this, function (ready) {
            var conduit = new Conduit(socket, socket)
            conduit.ready.wait(ready, 'unlatch')
            new Conduit.Server({ object: this, method: '_request' }, 'subordinate', conduit.read, conduit.write)
            this._destructible.addDestructor('conduit', conduit, 'destroy')
            conduit.listen(this._destructible.monitor('listen'))
        })
        thereafter.run(this, function (ready) {
            socket.write(new Buffer([ 0xaa, 0xaa, 0xaa, 0xaa ]), this._destructible.rescue('handshake'))
            ready.unlatch()
        })
        thereafter.ready.wait(this.ready, 'unlatch')
        this._destructible.completed(async())
    })
})

Responder.prototype._request = function (socket, envelope) {
    new Assignation.Response(this._interlocutor, socket, envelope).respond(this._destructible.rescue('request'))
}

Responder.prototype.destroy = function () {
    this._destructible.destroy()
}

module.exports = Responder
