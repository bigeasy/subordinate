module.exports = function (worker, server) {
    return function () {
        if (worker) {
            worker.disconnect()
        } else {
            server.close()
        }
    }
}
