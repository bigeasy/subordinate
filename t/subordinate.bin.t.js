require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var bin = require('../subordinate.bin')
    var io
    var UserAgent = require('vizsla')
    var ua = new UserAgent
    async(function () {
        io = bin([{
            key: '$.headers.value', secret: 'x', bind: 8888, index: 0, workers: 1, routers: 1
        }, [ 'node', 'intake.bin' ]], async())
        async([function () {
            io.emit('SIGTERM')
        }], function () {
            io.ready.wait(async())
        }, function () {
            setTimeout(async(), 1000)
        }, function () {
            ua.fetch({ url: 'http://127.0.0.1:8888' }, async())
        }, function (result) {
            console.log(result)
        })
    }, function () {
        console.log('here')
        assert(true, 'run')
    })
}
