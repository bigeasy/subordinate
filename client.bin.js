require('arguable')(module, require('cadence')(function (async, program) {
    var delta = require('delta')
    var Downgrader = { Socket: require('downgrader/socket') }
    async(function () {
        Downgrader.Socket.connect({
            secure: false,
            host: '127.0.0.1',
            port: 8888,
            headers: { identifier: 1 }
        }, async())
    }, function (request, socket, head) {
        console.log('upgraded', head.length)
        delta(async()).ee(socket).on('data', []).on('end')
    }, function (data) {
        console.log('!', Buffer.concat(data).toString())
    })
}))
