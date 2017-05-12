require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var bin = require('../router.bin')
    var io
    async(function () {
        io = bin({}, async())
    }, function () {
        assert(true, 'running')
        io.emit('SIGTERM')
    })
}
