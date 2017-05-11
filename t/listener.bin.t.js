require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var bin = require('../listener.bin')
    var io
    async(function () {
        io = bin({}, async())
    }, function () {
        assert(true, 'running')
        io.emit('SIGTERM')
    })
}
