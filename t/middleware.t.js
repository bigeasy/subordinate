require('proof')(2, require('cadence')(prove))

function prove (async, assert) {
    var events = require('events')
    var Subordinate = require('../subordinate')
    var delta = require('delta')
    var Conduit = require('conduit')
    var Client = require('conduit/client')
    var Request = require('assignation/request')
    var abend = require('abend')

    function createProcess (send) {
        var process = new events.EventEmitter
        process.send = send
        return process
    }

    var proxy = {}

    var server = { tcp: null, http: null }
    var destroyer = require('server-destroy')
    var http = require('http')
    server.http = http.createServer(function (request, response) {
        new Request(proxy.client, request, response, function (header) {
            header.addHTTPHeader('x-subordinate-key', 'a')
            header.addHTTPHeader('x-subordinate-hash', 3826002220)
            header.addHTTPHeader('x-subordinate-index', 1)
            header.addHTTPHeader('x-subordinate-listener-index', 0)
            header.addHTTPHeader('x-subordinate-workers', 3)
            header.addHTTPHeader('x-subordinate-secret', 'x')
        }).consume(abend)
    })
    destroyer(server.http)

    var process = createProcess(function () {})

    var subordinate = new Subordinate({
        process: process,
        middleware: function (request, response) {
            var buffer = new Buffer('hello, world\n')
            response.writeHead(200, {
                'content-length': buffer.length,
                'content-type': 'text/plain'
            })
            response.end(buffer)
        }
    })

    var tcp = require('net')

    async([function () {
        subordinate.listen(async())
    }, function (error) {
        console.log(error.stack)
        throw error
    }])

    async(function () {
        var socket
        server.tcp = tcp.createServer(function (socket) {
            process.emit('message', {
                module: 'subordinate',
                method: 'middleware',
                from: 0,
                to: 1,
                buffer: ''
            }, socket)
        })
        async(function () {
            server.tcp.listen(8081, async())
        }, function () {
            server.http.listen(8080, async())
        }, function () {
            socket = tcp.connect(8081, '127.0.0.1', async())
            delta(async()).ee(socket).on('connect')
        }, function () {
            console.log('- here')
            socket.write(new Buffer([ 0xaa, 0xaa, 0xaa, 0xaa ]))
            async(function () {
                delta(async()).ee(socket).on('readable')
            }, function () {
                console.log('readable')
                assert(socket.read().toString('hex'), 'aaaaaaaa', 'ready')
                proxy.conduit = new Conduit(socket, socket)
                proxy.client = new Client('subordinate', proxy.conduit.read, proxy.conduit.write)
                async(function () {
                    proxy.conduit.listen(async())
                })
                async(function () {
                    var request = http.get({ port: 8080 })
                    delta(async()).ee(request).on('response')
                }, function (response) {
                    assert(response.statusCode, 200, 'got')
                    async(function () {
                        proxy.conduit.destroy()
                        server.tcp.close()
                        server.http.destroy()
                        Error.stackTraceLimit = Infinity
                        subordinate.destroy()
                        socket.destroy()
                    })
                })
            })
        })
    })
}
