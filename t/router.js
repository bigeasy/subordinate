var cluster = require('cluster')
var net = require('net')

var server = net.createServer(function () {})
server.listen(8888)

process.on('message', function () {
    require('cluster').worker.disconnect()
})
