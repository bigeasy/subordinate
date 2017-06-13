// Fix-up the signature change of the cluster master message event that occurred
// between versions 4 and 6.

// https://nodejs.org/docs/v6.11.0/api/cluster.html#cluster_event_message_1

module.exports = function (f) {
    return function () {
        if (arguments.length == 3) {
            f(arguments[1], arguments[2])
        } else {
            f(arguments[0], arguments[1])
        }
    }
}
