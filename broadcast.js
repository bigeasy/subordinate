var cadence = require('cadence')

// TODO This is so obvious, probably not worth keeping.
module.exports = cadence(function (async, transmitters, method, message) {
    // TODO Should you run this in parallel? I believe so, since you're
    // never going to have too many children.
    async.map(function (key) {
        transmitters[key].request(method, message, async())
    })(transmitters)
})
