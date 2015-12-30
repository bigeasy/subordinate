require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
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
    var transmitter = new Transmitter(conduit), cookie
    async(function () {
        transmitter.request('set', { key: 'value' }, async())
    }, function (result) {
        assert(result, { set: true }, 'transmitter')
        conduit.emit('message', {})
        conduit.emit('message', { namespace: 'bigeasy.subordinate', type: 'request' })
    })
}
