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

// Return the first not null-like value.
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

// TODO Move this since I've generalized.
//
// Create a listener that will launch the router executable specfied by the
// `argv` option.
//
// The Node.js Cluster module spreads the TCP connections to a port across
// multiple workers. The router is the child process that shares the work of
// responding to parituclar sockets or HTTP requests.
//
// Subordinate implements a worker pinning where
//
// We let the Cluster module distribute he work using its load balancing
// strategy. The router will inspect the request for a key, hash the key, and
// then send it to the correct worker based on the hashed key value.
//
// That describes hashed operation which is what's brining this project to
// life. Other modes operation suggest themselves, but I'm not using them quite
// yet.
//
// The `secret` option is used to indicate that a request has
// been routed and is supposed to go to a specific worker. The when a request
// comes in from outside the application the router that receives it will chose
// a worker based on a hash of the key value. It then forwards the request
// through a long-lived multiplexed connection to the worker at the hashed
// index.
//
// If you want to directly specify a worker by index you would specify the index
// in a request header along with the secret to indicate that you know what
// you're doing.
//
// For inter-process communication between trusted processes the secret may be
// generated externally and passed into the subordinate executable. Otherwise,
// it is generated internally.

//
function Listener () {
    this._routers = []
    this._destructible = new Destructible('master')
    this._destructible.markDestroyed(this)
    this._destructible.addDestructor('kill', this, '_kill')
}

Listener.prototype.destroy = function () {
    this._destructible.destroy()
}

// https://groups.google.com/forum/#!msg/comp.unix.wizards/GNU3ZFJiq74/ZFeCKhnavkMJ
Listener.prototype._kill = function () {
    this._routers.forEach(function (listener) { listener.kill() })
}

Listener.prototype.run = cadence(function (async, count, argv, env) {
    argv = argv.slice()
    var command = argv.shift()
    cluster.setupMaster({ exec: command, argv: argv })
    for (var i = 0, I = coalesce(count, 1); i < I; i++) {
        var listener = cluster.fork(env)
        this._routers.push(listener)
        async(function () {
            delta(async()).ee(listener).on('exit')
        }, function (code, signal) {
            interrupt.assert(this.destroyed, 'listener error exit', { code: code, signal: signal })
            return []
        })
    }
})

module.exports = Listener
