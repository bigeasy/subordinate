/*
    ___ usage ___ en_US ___
    usage: client <options> [worker]

    options:

    -l, --location <path or address:port>

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
    var location = program.ultimate.location, request
    if (/^[.\/]/.test(location)) {
        request = {
            secure: false,
            socketPath: location,
            headers: headers
        }
    } else {
        location = location.split(':')
        request = {
            secure: false,
            host: location[0],
            port: +location[1],
            headers: headers
        }
    }
    async(function () {
        Downgrader.Socket.connect(request, async())
    }, function (request, socket, head) {
        console.log('upgraded', head.length)
        delta(async()).ee(socket).on('data', []).on('end')
    }, function (data) {
        console.log('!', Buffer.concat(data).toString())
    })
}))
