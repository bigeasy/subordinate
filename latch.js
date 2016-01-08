var cadence = require('cadence')

function listen (name, conduit, callback) {
    conduit.on('message', listener.bind(this))
    function listener (message) {
        if (message.namespace == 'bigeasy.subordinate' && message.type == 'latch') {
            conduit.removeListener('message', listener)
            callback(null, message.value)
        }
    }
}

exports.wait = cadence(function (async, name, children) {
    var results = {}
    async(function () {
        children.forEach(function (child) {
            listen(name, child, async())
        })
    }, [])
})

exports.send = function (conduit, name, value) {
    conduit.send({
        namespace: 'bigeasy.subordinate',
        type: 'latch',
        name: name,
        value: value
    })
}
