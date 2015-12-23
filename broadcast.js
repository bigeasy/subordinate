var cadence = require('cadence')

module.exports = cadence(function (async, transmitters, method, message) {
    var broadcast = {}
    async(function () {
        // TODO Should you run this in parallel? I believe so, since you're
        // never going to have too many children.
        async.forEach(function (key) {
            async(function () {
                transmitters[key].request(method, message, async())
            }, function (response) {
                broadcast[key] = response
            })
        })(Object.keys(transmitters))
    }, function () {
        return broadcast
    })
})
