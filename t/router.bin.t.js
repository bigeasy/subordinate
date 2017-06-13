require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var bin = require('../router.bin')
    var io
    async(function () {
        io = bin({
            key: '$.headers.value', secret: 'x', bind: 8888, index: 0, workers: 3
        }, async())
        async(function () {
            io.ready.wait(async())
        }, function () {
            io.emit('message', {
                module: 'subordinate',
                method: 'shutdown'
            })
        })
    }, function () {
        assert(true, 'run')
    })
}
