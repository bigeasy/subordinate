var cadence = require('cadence')
var slice = [].slice
var Cliffhanger = require('cliffhanger')

function Transmitter (conduit) {
    this._conduit = conduit
    this._cliffhanger = new Cliffhanger
    this._conduit.on('message', this._message.bind(this))
    this._cookie = [ 0 ]
}

Transmitter.prototype.request = cadence(function (async, method, body) {
    var handle = slice.call(arguments, 3)
    this._conduit.send.apply(this._conduit, [{
        namespace: 'bigeasy.subordinate',
        type: 'request',
        method: method,
        cookie: this._cliffhanger.invoke(async()),
        body: body
    }].concat(handle, async()))
})

Transmitter.prototype._message = function (message) {
    if (message.namespace == 'bigeasy.subordinate' && message.type == 'response') {
        this._cliffhanger.resolve(message.cookie, [ null, message.body ])
    }
}

module.exports = Transmitter
