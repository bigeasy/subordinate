require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var Transmitter = require('../../transmitter')
    var Conduit = require('../../message/conduit')
    var events = require('events')
    var program = new events.EventEmitter
    program.send = function (message, callback) {
        program.emit('message', {
            namespace: 'bigeasy.subordinate',
            type: 'response',
            cookie: message.cookie,
            body: { set: true }
        })
    }
    var transmitter = new Transmitter(new Conduit(program)), cookie
    async(function () {
        transmitter.request('set', { key: 'value' }, async())
    }, function (result) {
        assert(result, { set: true }, 'transmitter')
        program.emit('message', {})
        program.emit('message', { namespace: 'bigeasy.subordinate', type: 'request' })
    })
}
