require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var events = require('events')
    var Dispatcher = require('../../dispatcher')
    var Conduit = require('../../message/conduit')
    var process = new events.EventEmitter
    var done = async()

    assert(Dispatcher, 'require')

    function Service () {
    }

    Service.prototype.post = function (message, callback) {
        assert(message, { hello: 'world' }, 'body')
        callback(null, { hello: 'nurse' })
    }

    Service.prototype.get = function (message, callback) {
        assert(message, {}, 'empty')
        callback(null, { hello: 'nurse' })
    }

    var service = new Service
    var dispatcher = new Dispatcher(service)

    dispatcher.dispatch('post')
    dispatcher.dispatch('get', 'get')

    process.send = function (message) {
        listener.unlisten()
        listener.unlisten()
        done()
    }
    var listener = dispatcher.listen(new Conduit(process))
    process.emit('message', {
        namespace: 'bigeasy.subordinate',
        type: 'request',
        method: 'post',
        cookie: 'x',
        body: { hello: 'world' }
    })
}
