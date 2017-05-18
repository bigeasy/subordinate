require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var Router = require('../router')
    var Distributor = require('../distributor')

    var distributor = new Distributor(0, 'x', 3, ['$.headers.value'])

    var http = require('http')
    var Socket = require('downgrader/socket')

    var router = new Router({
        distributor: distributor,
        bind: {
            listen: function (server, callback) { server.listen(8080, callback) },
        },
        secret: 'x',
        parent: {
            send: function (message) {
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
                            'x-subordinate-request-index': '0',
                            'x-subordinate-secret': 'x'
                        }
                    }
                }, 'socket')
            }
        }
    })

    async(function () {
        router.run(async())
    })

    async(function () {
        router.ready.wait(async())
    }, function () {
        Socket.connect({
            secure: false,
            host: '127.0.0.1',
            port: 8080,
            headers: { value: 'x' }
        }, async())
    }, function (request, socket, header) {
        router.destroy()
    })
}
