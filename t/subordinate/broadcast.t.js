require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var broadcast = require('../../broadcast')
    var Transmitter = require('../../transmitter')
    var events = require('events')
    var conduit = new events.EventEmitter
    conduit.send = function (message, callback) {
        conduit.emit('message', {
            namespace: 'bigeasy.subordinate',
            type: 'response',
            cookie: message.cookie,
            body: { set: true }
        })
        callback()
    }
    var transmitters = {}
    transmitters.one = new Transmitter(conduit)
    async(function () {
        broadcast(transmitters, 'set', { key: 'value' }, async())
    }, function (result) {
        assert(result, { one: { set: true } }, 'broadcast')
    })
}
