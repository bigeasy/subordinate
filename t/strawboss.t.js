require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var StrawBoss = require('../strawboss')
    var strawboss = new StrawBoss({ argv: [], process: {} })
    strawboss.message({})
    var strawboss = new StrawBoss({
        argv: [ 'node', 't/subordinate' ],
        process: {
            send: function (message) {
                assert(message, { module: 'other' }, 'assert')
            }
        }
    })
    async(function () {
        strawboss.run(async())
        strawboss.send({ key: 'value' })
        strawboss.message({ index: 0, module: 'subordinate' })
        strawboss.message({ module: 'other' })
        strawboss.destroy()
    }, function () {
        assert(true, 'done')
    })
}
