// The listener implements a Node.js Cluster "Master." I call it a listener
// because I think of it as listening to the bound port.
//
// Our listener implementation starts the cluster workers. It uses the
// `Cluster.setupMaster` method to specify a specific worker executable instead
// of using the behavior that looks like fork yet behaves nothing like fork and
// is therefore very confusing.
//
// In case you ever forget; you must use cluster to support Windows. Your
// support here should be enough to evolve a Windows implementation that is as
// performant as Node.js can be on Windows. Windows is slow about passing
// handles, so you shouldn't roll your own handle passing strategy. It would
// only work for TCP/TLS anyway. You can't pass the TCP handles of an HTTP
// server around and no your are not going to implement HTTP parsing.

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

// Create a listener. The `secret` is used to indicate that a request has been
// routed and is supposed to go to a specific worker.

//
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
