require('proof')(1, prove)

function prove (assert) {
    var disconnector = require('../disconnector')
    disconnector({
        disconnect: function () {
            assert(true, 'disconnected')
        }
    })()
}
