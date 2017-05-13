require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var Master = require('../listener')
    var master = new Master({ argv: [ 't/router.js' ] })
    async(function () {
        master.run(async())
    }, function () {
        assert(true, 'done')
    })

    async(function () {
        setTimeout(async(), 150)
    }, function () {
        master.destroy()
    })
}
