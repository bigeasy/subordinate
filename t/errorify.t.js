require('proof')(6, prove)

function prove (assert) {
    var errorify = require('../errorify')
    var response = {
        writeHead: function (statusCode, statusMessage, headers) {
            assert(statusCode, 404, 'status')
            assert(statusMessage, 'Not Found', 'message')
            assert(headers, { 'content-type': 'text/plain' }, 'headers')
        },
        end: function (message) {
            assert(message.toString(), 'Not Found', 'body')
        }
    }
    errorify(response, null)(404)
    errorify(null, function (error) { assert(error, 999, 'no message') })(999)
    errorify(null, function (error) { assert(error, 'x', 'not message') })('x')
}
