var cluster = require('cluster')
var children = require('child_process')
var net = require('net')

if (cluster.isMaster) {
    cluster.fork()
} else {
    var child = children.spawn('node', [ 'worker.js' ], {
        stdio: [ 'inherit', 'inherit', 'inherit', 'ipc' ]
    })
    var server = net.createServer()
    server.listen(8888, function () {
        setTimeout(function () { child.send({ key: 1 }, server) }, 1000)
     })
    child.on('exit', function () { console.log(arguments) })
    console.log('forked')
}
