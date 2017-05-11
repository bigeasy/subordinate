var coalesce = require('coalesce')
var cadence = require('cadence')

function StrawBoss (options) {
    this._workers = coalesce(options.workers, 1)
}

StrawBoss.prototype.run = cadence(function (async) {
    return []
})

module.exports = StrawBoss
