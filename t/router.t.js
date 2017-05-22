require('proof')(4, require('cadence')(prove))

function prove (async, assert) {
    var Router = require('../router')
    var Distributor = require('../distributor')

    var distributor = new Distributor(0, 'x', 3, ['$.headers.value'])

    var delta = require('delta')
    var abend = require('abend')
    var http = require('http')
    var Socket = require('downgrader/socket')
    var Responder = require('../responder')
    var Interlocutor = require('interlocutor')

    var interlocutor = new Interlocutor(function (request, response) {
        response.writeHead(200, { 'content-type': 'text/plain' })
        response.end('hello, world')
    })
    var responder = new Responder(interlocutor)

    var sent = [function (message) {
        assert(message, {
            module: 'subordinate',
            method: 'socket',
            index: 2,
            buffer: '',
            body: {
                httpVersion: '1.1',
                url: '/',
                method: 'GET',
                headers: {
                    value: 'x',
                    connection: 'Upgrade',
                    upgrade: 'Conduit',
                    'sec-conduit-protocol-id': 'c2845f0d55220303d62fc68e4c145877',
                    'sec-conduit-version': '1',
                    host: '127.0.0.1:8080',
                    'x-subordinate-index': '2',
                    'x-subordinate-key': '["x"]',
                    'x-subordinate-hash': '303091727',
                    'x-subordinate-workers': '3',
                    'x-subordinate-from': '0',
                    'x-subordinate-secret': 'x'
                }
            }
        }, 'socket')
    }, function (message, handle) {
        assert(message, {
            module: 'subordinate',
            method: 'middleware',
            from: 0,
            to: 2,
            buffer: '',
            body: null
        }, 'middleware socket message')
        new Responder(interlocutor).listen(handle, abend)
    }]

    var router = new Router({
        distributor: distributor,
        bind: {
            listen: function (server, callback) { server.listen(8080, callback) },
            connect: function (request) {
                request.hostname = '127.0.0.1'
                request.port = 8080
                return request
            }
        },
        secret: 'x',
        parent: {
            send: function (message, handle) {
                sent.shift().call(null, message, handle)
            }
        }
    })

    async([function () {
        router.run(async())
    }, function (error) {
        console.log(error.stack)
        throw error
    }])

    async([function () {
        async(function () {
            router.ready.wait(async())
        }, function () {
            Socket.connect({
                secure: false,
                host: '127.0.0.1',
                port: 8080,
                headers: { value: 'x' }
            }, async())
        }, function (socket) {
            socket.destroy()
            var request = http.get({
                headers: { value: 'x' },
                hostname: '127.0.0.1',
                port: 8080
            })
            delta(async()).ee(request).on('response')
        }, function (response) {
            async(function () {
                delta(async()).ee(response).on('data')
            }, function (buffer) {
                assert(buffer.toString(), 'hello')
            })
        }, function () {
            var request = http.get({
                headers: { value: 'x' },
                hostname: '127.0.0.1',
                port: 8080
            })
            delta(async()).ee(request).on('response')
        }, function (response) {
            async(function () {
                delta(async()).ee(response).on('data')
            }, function (buffer) {
                assert(buffer.toString(), 'hello')
            })
        }, function () {
            router.destroy()
        })
    }, function (error) {
        console.log(error)
    }])
}
