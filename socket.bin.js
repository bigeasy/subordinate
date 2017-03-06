/*
    ___ usage ___ en_US ___
    usage: client <options> [worker]

    options:

    -h, --header <key=value>

        The name of a header to provide.

    ___ $ ___ en_US ___

    ___ . ___
 */
require('arguable')(module, require('cadence')(function (async, program) {
    var delta = require('delta')
    var Downgrader = { Socket: require('downgrader/socket') }
    var headers = {}
    program.grouped.header.forEach(function (header) {
        var $ = /^([^=]+)=(.*)$/.exec(header)
        headers[$[1]] = $[2]
    })
    async(function () {
        Downgrader.Socket.connect({
            secure: false,
            host: '127.0.0.1',
            port: 8888,
            headers: headers
        }, async())
    }, function (request, socket, head) {
        console.log('upgraded', head.length)
        delta(async()).ee(socket).on('data', []).on('end')
    }, function (data) {
        console.log('!', Buffer.concat(data).toString())
    })
}))
