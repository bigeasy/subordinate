require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var Transmitter = require('../../transmitter')
    var Conduit = require('../../message/conduit')
    var hashed = require('../../hashed')
    var events = require('events')
    var program = new events.EventEmitter
    program.send = function (message) {
        assert(message, {
            namespace: 'bigeasy.subordinate',
            type: 'request',
            method: 'get',
            cookie: '1',
            body: { key: 'value' }
        }, 'sent')
        this.emit('message', {
            namespace: 'bigeasy.subordinate',
            type: 'response',
            cookie: '1',
            body: { hello: 'world' }
        })
    }
    var transmitters = [new Transmitter(new Conduit(program))]
    var fnv = require('hash.fnv')
    async(function () {
        hashed(fnv, transmitters, 'get', 'x', { key: 'value' }, async())
    }, function (result) {
        assert(result, { hello: 'world' }, 'hashed request')
    })
}
