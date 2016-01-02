var cadence = require('cadence')
var slice = [].slice

function Conduit (process) {
    this._process = process
}

Conduit.prototype.createConnection = function (reactor) {
    return new Connection(this._process, reactor)
}

function Connection (process, reactor) {
    this._process = process
    this._reactor = reactor
    this._listener = function (message) { reactor.push(message) }
    this._process.on('message', this._listener)
}

Connection.prototype.request = function (vargs) {
    this._process.send.apply(this._process, vargs)
}

Connection.prototype.end = function () {
    if (this._listener) {
        this._process.removeListener('message', this._listener)
        this._listener = null
    }
}

module.exports = Conduit
