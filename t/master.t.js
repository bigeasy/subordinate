require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var Master = require('../master')
    var master = new Master({
        listener: [ 't/listener.js' ],
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
