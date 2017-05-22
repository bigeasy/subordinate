module.exports = function (callback) {
    return function (error) {
        if (error == null) {
            return
        }

        if (typeof error == 'number') {
            var message = new Buffer(http.STATUS_CODES[error])
            if (message != null) {
                response.writeHead(error, http.STATUS_CODES[error], {
                    'content-type': 'text/plain',
                    'contnet-length': String(message.length)
                })
                response.end(message)
            }
            return
        }

        callback(error)
    }
}
