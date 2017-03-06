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
            if (request.headers['x-intake-reassigned'] == null) {
                console.log('will reassigned')
                request.headers['x-intake-reassigned'] = '1'
                var index = +request.headers['x-subordinate-index']
                subordinate.reassign(1 - index, request, socket)
            } else {
                console.log('was reassigned')
                socket.write('Hello, World\n')
                socket.end()
            }
        }
    })
    subordinate.listen(program)
}))
