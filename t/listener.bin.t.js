require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var bin = require('../worker.bin')
    async(function () {
        bin({}, async())
    }, function () {
        console.log('here')
    })
}
