require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var Master = require('../master')
    var master = new Master({
        listener: 't/listener.js',
        program: {
            ultimate: {},
            grouped: { key: [] },
            argv: []
        },
        cluster: require('cluster')
    })
    master.run()
    async(function () {
    }, function () {
    })
}
