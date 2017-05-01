var net = require('net')
var children = require('child_process')

var child = children.spawn('node', [ 'child.js' ], { stdio: [ 'inherit', 'inherit', 'inherit', 'ipc' ] })

var server = net.createServer(function (socket) {
    console.log('listen', socket.remotePort)
    child.send({ method: 'socket' }, socket)
})

server.listen(8888, function () {
    console.log('listen')
    child.send({
        method: 'connect'
    })
})
