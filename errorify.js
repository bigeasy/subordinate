var http = require('http')

module.exports = function (response, callback) {
    return function (error) {
        if (error == null) {
            return
        }

        if (typeof error == 'number') {
            var message = http.STATUS_CODES[error]
            if (message != null) {
                response.writeHead(error, message, { 'content-type': 'text/plain' })
                response.end(message)
                return
            }
        }

        callback(error)
    }
}
