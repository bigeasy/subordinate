require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var Master = require('../listener')
    var master = new Master
    async(function () {
        master.run(1, [ 't/router.js' ], function () { return {} }, async())
    }, function () {
        assert(true, 'done')
    })

    async(function () {
        setTimeout(async(), 150)
    }, function () {
        master.destroy()
    })
}
