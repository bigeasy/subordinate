require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var Signal = require('signal')
    var bin = require('../router.bin')
    var io
    var ready = new Signal
    async(function () {
        io = bin({
            key: '$.headers.value', secret: 'x', bind: 8888, index: 0, workers: 3
        }, { properties: { ready: ready } }, async())
        async(function () {
            ready.wait(async())
        }, function () {
            io.emit('SIGTERM')
        })
    }, function () {
        assert(true, 'run')
    })
}
