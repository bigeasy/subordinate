require('proof')(3, require('cadence')(prove))

function prove (async, assert) {
    var events = require('events')

    var Subordinate = require('../subordinate')
    assert(Subordinate, 'require')

    var process = new events.EventEmitter

    var subordinate = new Subordinate({
        process: {
            send: function (message, handle) {
                assert(message, {
                    module: 'subordinate',
                    method: 'socket',
                    index: 1,
                    buffer: '',
                    body: {
                        httpVersion: '1.1',
                        headers: {},
                        url: '/',
                        method: 'GET',
                        rawHeaders: []
                    }
                }, 'reassign message')
                assert(handle === socket, 'reassign handle')
            }
        }
    })

    var socket = {}

    subordinate.reassign(1, {
        httpVersion: '1.1',
        headers: {},
        url: '/',
        method: 'GET',
        rawHeaders: []
    }, socket)
}
