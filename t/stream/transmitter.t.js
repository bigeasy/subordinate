require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var Transmitter = require('../../transmitter')
    var Conduit = require('../../stream/conduit')
    var stream = require('stream')
    var byline = require('byline')

    var input = new stream.PassThrough
    var output = new stream.PassThrough

    byline.createStream(output, { encoding: 'utf8' }).on('data', function (line) {
        var message = JSON.parse(line)
        assert(message, {
            namespace: 'bigeasy.subordinate',
            type: 'request',
            method: 'set',
            cookie: '1',
            body: { key: 'value' }
        }, 'request')
        input.write(JSON.stringify({
            namespace: 'bigeasy.subordinate',
            type: 'response',
            cookie: message.cookie,
            body: { set: true }
        }) + '\n')
    })

    var transmitter = new Transmitter(new Conduit(input, output)), cookie

    async(function () {
        transmitter.request('set', { key: 'value' }, async())
    }, function (result) {
        assert(result, { set: true }, 'transmitter')
    })
}
