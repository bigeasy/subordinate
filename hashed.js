var cadence = require('cadence')

module.exports = cadence(function (async, hash, transmitters, method, key, body) {
    var buffer = new Buffer(key)
    var transmitter = transmitters[hash(0, buffer, 0, buffer.length) % transmitters.length]
    transmitter.request(method, body, async())
})
