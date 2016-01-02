require('proof')(3, require('cadence')(prove))

function prove (async, assert) {
    var events = require('events')
    var Dispatcher = require('../../dispatcher')
    var Conduit = require('../../stream/conduit')
    var stream = require('stream')
    var process = new events.EventEmitter
    var done = async()

    var input = new stream.PassThrough
    var output = new stream.PassThrough

    assert(Dispatcher, 'require')

    function Service () {
    }

    Service.prototype.post = function (message, callback) {
        assert(message, { hello: 'world' }, 'body')
        callback(null, { hello: 'nurse' })
    }

    Service.prototype.get = function (message, callback) {
        callback(null, { hello: 'nurse' })
    }

    var service = new Service
    var dispatcher = new Dispatcher(service)

    dispatcher.dispatch('post')
    dispatcher.dispatch('get', 'get')

    var listener = dispatcher.listen(new Conduit(input, output))

    process.send = function (message) {
        listener.unlisten()
        listener.unlisten()
        done()
    }
    input.write(JSON.stringify({ namespace: 'ignore' }) + '\n')
    input.write(JSON.stringify({ namespace: 'bigeasy.subordinate', type: 'request', method: 'foo' }) + '\n')
    input.write(JSON.stringify({
        namespace: 'bigeasy.subordinate',
        type: 'request',
        method: 'post',
        cookie: 'x',
        body: { hello: 'world' }
    }) + '\n')
    output.on('readable', function () {
        var read = output.read()
        if (read == null) {
            done()
        } else {
            assert(JSON.parse(read), {
                namespace: 'bigeasy.subordinate',
                type: 'response',
                cookie: 'x',
                body: { hello: 'nurse' }
            }, 'response')
            input.end()
            listener.unlisten()
            listener.unlisten()
        }
    })
}
