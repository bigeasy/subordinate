require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var latch = require('../../latch')
    var events = require('events')
    var conduit = new events.EventEmitter

    conduit.send = function (message) {
        conduit.emit('message', message)
    }

    async(function () {
        latch.wait('x', [ conduit ], async())
        conduit.emit('message', {})
        latch.send(conduit, 'x', 1)
    }, function (result) {
        assert(result, [ 1 ], 'wait')
    })
}
