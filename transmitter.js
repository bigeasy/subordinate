var cadence = require('cadence')
var slice = [].slice
var Cliffhanger = require('cliffhanger')
var slice = [].slice
var Reactor = require('reactor')
var Turnstile = require('turnstile')
var restrict = require('restrictor')

function Transmitter (conduit) {
    this.receiving = new Reactor({ object: this, method: '_message' })
    this._turnstile = new Turnstile({ workers: 24 })
    this._connection = conduit.createConnection(this.receiving)
    this._cliffhanger = new Cliffhanger
    this._cookie = [ 0 ]
}

Transmitter.prototype.request = restrict(cadence(function (async, timeout, method, body) {
    this._connection.request([{
        namespace: 'bigeasy.subordinate',
        type: 'request',
        method: method,
        cookie: this._cliffhanger.invoke(async()),
        body: body
    }].concat(slice.call(arguments, 3)))
}))

Transmitter.prototype._message = cadence(function (async, timeout, message) {
    if (message.namespace == 'bigeasy.subordinate' && message.type == 'response') {
        this._cliffhanger.resolve(message.cookie, [ null, message.body ])
    }
})

module.exports = Transmitter
