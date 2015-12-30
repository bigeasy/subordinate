require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var processes = require('child_process')
    var path = require('path')
    var Boss = require('../../boss')
    var stream = require('stream')
    var abend = require('abend')
    var child = processes.spawn('node', [
        path.join(__dirname, 'worker.bin.js')
    ], {
        stdio: [ 'ignore', 'inherit', 'pipe', 'pipe', 'ipc' ]
    })
    var boss = new Boss([ child ])
    var monitor = function (child, index, callback) {
        child.on('close', function (code, signal) { callback(null, code, signal) })
    }
    async(function () {
        boss.start(monitor, abend)
    }, function (result) {
        boss.stopped.enter(async())
        boss.stop()
    }, function () {
        assert(true, 'done')
    })
}
