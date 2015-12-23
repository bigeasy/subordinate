require('proof')(3, require('cadence')(prove))

function prove (async, assert) {
    var events = require('events')
    var Dispatcher = require('../../dispatcher')
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

    var listener = dispatcher.listen(process)

    process.send = function (message) {
        assert(message, {
            namespace: 'bigeasy.subordinate',
            type: 'response',
            cookie: 'x',
            body: { hello: 'nurse' }
        }, 'message')
        listener.unlisten()
        done()
    }
    process.emit('message', { namespace: 'ignore' })
    process.emit('message', { namespace: 'bigeasy.subordinate', method: 'foo'  })
    process.emit('message', {
        namespace: 'bigeasy.subordinate',
        method: 'post',
        cookie: 'x',
        body: { hello: 'world' }
    })
}
