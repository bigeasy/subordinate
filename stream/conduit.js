var abend = require('abend')
var cadence = require('cadence')
var Delta = require('delta')
var byline = require('byline')
var Reactor = require('reactor')
var Operation = require('operation')
var Staccato = require('staccato')
var Delta = require('delta')
var slice = [].slice

var pump = cadence(function (async, input, output, reactor) {
    async(function () {
        new Delta(async())
            .ee(byline.createStream(input, { encoding: 'utf8' }))
            .on('data', function (line) { reactor.push(JSON.parse(line)) })
            .on('end')
    }, function () {
        output.end(async())
    })
})

function Conduit (input, output) {
    this._input = input
    this._output = output
}

Conduit.prototype.createConnection = function (reactor) {
    return new Connection(this._input, this._output, reactor)
}

function Connection (input, output, reactor) {
    this._output = output
    pump(input, output, reactor, abend)
}

Connection.prototype.request = function (vargs) {
    this._output.write(JSON.stringify(vargs[0]) + '\n')
}

Connection.prototype.end = function () {
}

module.exports = Conduit
