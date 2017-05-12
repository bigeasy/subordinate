require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var Master = require('../listener')
    var master = new Master({
        listener: [ 't/router.js' ],
        program: {
            ultimate: {},
            grouped: { key: [] },
            argv: []
        },
        cluster: require('cluster')
    })
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
