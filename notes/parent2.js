var cluster = require('cluster')
var children = require('child_process')
var net = require('net')

if (cluster.isMaster) {
    var child = cluster.fork()
    var pipe = new net.Socket({ fd: 3  })
    child.send({ greeting: 'hello' }, pipe)
    process.on('message', function (message, handle) { child.send(message, handle) })
} else {
    var server = net.createServer()
    server.listen(8888)
    process.on('message', function (message, handle) {
        console.log(message, !!handle)
        handle.write('response')
    })
}
