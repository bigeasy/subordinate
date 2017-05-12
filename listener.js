// From the Node.js API.
var path = require('path')
var assert = require('assert')
var url = require('url')
var cluster = require('cluster')
var children = require('child_process')

// Common utilities.
var coalesce = require('extant')

// Control-flow utilities.
var delta = require('delta')
var cadence = require('cadence')
var Signal = require('signal')

// Controlled demolition of objects.
var Destructible = require('destructible')

// Exceptions that you can catch by type.
var interrupt = require('interrupt').createInterrupter('subordinate')

// Contextualized callbacks and event handlers.
var Operation = require('operation/variadic')

function Listener (options) {
    this._secret = options.secret
    this._listener = options.listener
    this._count ={
        listeners: coalesce(options.program.ultimate.listeners, 1),
        workers: coalesce(options.program.ultimate.workers, 1)
    }
    this._listeners = []
    this._destructible = new Destructible('master')
    this._destructible.markDestroyed(this)
    this._destructible.addDestructor('kill', this, '_kill')
    this._argv = options.program.argv.slice()
    this._command = this._argv.shift()
}

Listener.prototype.destroy = function () {
    this._destructible.destroy()
}

// https://groups.google.com/forum/#!msg/comp.unix.wizards/GNU3ZFJiq74/ZFeCKhnavkMJ
Listener.prototype._kill = function () {
    this._listeners.forEach(function (listener) { listener.kill() })
}

Listener.prototype.run = cadence(function (async) {
    cluster.setupMaster({
        exec: path.join(__dirname, this._listener.shift()),
        argv: this._listener

    })
    for (var i = 0; i < this._count.listeners; i++) {
        var listener = cluster.fork({ SUBORDINATE_SECRET: this._secret })
        this._listeners.push(listener)
        async(function () {
            delta(async()).ee(listener).on('exit')
        }, function (code, signal) {
            interrupt.assert(this.destroyed, 'listener error exit', { code: code, signal: signal })
            return []
        })
    }
})

module.exports = Listener
