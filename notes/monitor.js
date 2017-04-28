var children = require('child_process')

var child = children.spawn('node', [ 'parent2.js' ], {
    stdio: [ 'inherit', 'inherit', 'inherit', 'pipe', 'ipc' ]
})

child.on('exit', function () { console.log('done') })

child.stdio[3].on('data', function (data) { console.log('>', data.toString()) })

var monitor = children.spawn('node', [ 'logger.js' ], {
    stdio: [ 'inherit', 'inherit', 'inherit', 'pipe' ]
})

child.send({ monitor: 'yes' }, monitor.stdio[3])
