console.log('started')

var cluster = require('cluster')
console.log(cluster.isMaster, cluster.isWorker)
process.on('message', function (message, handle) { console.log(arguments) })
process.stdin.resume()
