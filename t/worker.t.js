require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var Worker = require('../worker')
    var worker = new Worker({
        listen: function (server, callback) {
            callback()
        }
    })
    async(function () {
        worker.run(async())
    }, function () {
    })
}
