require('arguable')(module, require('cadence')(function (async, program) {
    var url = require('url')
    var Subordinate = require('./subordinate')
    var subordinate = new Subordinate({
        middleware: function (request, response, next) {
            if (true || url.parse(request.url).path.startsWith('/message')) {
                console.log('HEREE!')
                response.writeHead(200, { 'content-type': 'text/plain' })
                response.write('Hello, World!\n')
                response.end()
                console.log('did it')
            }
        },
        connect: function (request, socket) {
            if (request.reassigned == null) {
                subordinate.reassign(request, socket, new Buffer(0))
            }
            socket.write('Hello, World\n')
            socket.end()
        }
    })
    subordinate.listen(program)
}))
