var cadence = require('cadence')
var slice = [].slice
var Cliffhanger = require('cliffhanger')
var slice = [].slice
var pump = require('./pump')

function Transmitter () {
    var vargs = slice.call(arguments)
    if (vargs.length == 2)  {
        var input = vargs.shift(), output = vargs.shift()
        this._staccato = new Staccato(output)
        run(options.input, this._sender, this._invoking, abend)
    } else {
        this._conduit = vargs.shift()
        this._conduit.on('message', this._message.bind(this))
    }
    this._async = ! /^v0\./.test(process.version)
    this._cliffhanger = new Cliffhanger
    this._cookie = [ 0 ]
}

Transmitter.prototype.request = cadence(function (async, method, body) {
    var request = {
        namespace: 'bigeasy.subordinate',
        type: 'request',
        method: method,
        cookie: this._cliffhanger.invoke(async()),
        body: body
    }
    if (this._conduit) {
        var suffix = slice.call(arguments, 3)
        if (this._async) {
            suffix.push(async())
        }
        this._conduit.send.apply(this._conduit, [request].concat(suffix))
    } else {
        this._sender.write(new Buffer(JSON.stringify(request) + '\n'), async())
    }
})

Transmitter.prototype._message = function (message) {
    if (message.namespace == 'bigeasy.subordinate' && message.type == 'response') {
        this._cliffhanger.resolve(message.cookie, [ null, message.body ])
    }
}

module.exports = Transmitter
