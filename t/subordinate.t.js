require('proof')(5, require('cadence')(prove))

function prove (async, assert) {
    var events = require('events')

    var Subordinate = require('../subordinate')
    assert(Subordinate, 'require')

    function createProcess (send) {
        var process = new events.EventEmitter
        process.send = send
        return process
    }

    var subordinate = new Subordinate({
        process: createProcess(function (message, handle) {
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
        })
    })

    var socket = {}

    subordinate.reassign(1, {
        httpVersion: '1.1',
        headers: {},
        url: '/',
        method: 'GET',
        rawHeaders: []
    }, socket)

    var subordinate = new Subordinate({
        process: createProcess(function (message, handle) {
            assert(message, {
                module: 'subordinate',
                method: 'socket',
                index: null,
                buffer: '',
                body: {
                    httpVersion: '1.1',
                    headers: {},
                    url: '/',
                    method: 'GET',
                    rawHeaders: []
                }
            }, 'rehash message')
            assert(handle === socket, 'rehash handle')
        })
    })

    subordinate.reassign({
        httpVersion: '1.1',
        headers: {},
        url: '/',
        method: 'GET',
        rawHeaders: []
    }, socket)
}
