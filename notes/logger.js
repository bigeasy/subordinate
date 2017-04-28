console.log('logggering')
var net = require('net')
var socket = new net.Socket({ fd: 3 })

socket.on('data', function (data) {
    console.log('!', data.toString())
})

process.stdin.resume()
