// From the Node.js API.
var path = require('path')
var assert = require('assert')
var url = require('url')
var cluster = require('cluster')
var children = require('child_process')

// Common utilities.
var coalesce = require('extant')
// Control-flow utilities.
var cadence = require('cadence')

// Controlled demolition of objects.
var Destructible = require('destructible')

// Exceptions that you can catch by type.
var interrupt = require('interrupt').createInterrupter('subordinate')
var Operation = require('operation/variadic')

var Distributor = require('./distributor')

function Master (options) {
    this._secret = options.secret
    this._listener = options.listener
    this._count ={
        listeners: coalesce(options.program.ultimate.listeners, 1),
        workers: coalesce(options.program.ultimate.workers, 1)
    }
    this._listeners = []
    this._workers = []
    this._distributor = new Distributor(this._secret, this._workerCount, options.program.grouped.key)
    this._destructible = new Destructible('subordinate')
    this._destructible.markDestroyed(this)
    this._destructible.addDestructor('kill', this, '_kill')
    this._argv = options.program.argv.slice()
    this._command = this._argv.shift()
    this._cluster = options.cluster
}

Master.prototype.destroy = function () {
    this._destructible.destroy()
}

Master.prototype._kill = function () {
    this._listeners.forEach(function (listener) { listener.kill() })
    this._workers.forEach(function (worker) { worker.kill() })
}

// https://groups.google.com/forum/#!msg/comp.unix.wizards/GNU3ZFJiq74/ZFeCKhnavkMJ

Master.prototype._startWorker = function (index) {
    // TODO What else do you need to set?
    var worker = children.spawn(this._command, this._argv, {
        stdio: [ 'inherit', 'inherit', 'inherit', 'ipc' ]
    })
    worker.on('message', Operation([ this, '_message' ]))
    worker.on('exit', function (code, signal) {
        interrupt.assert(code == 0 || signal == 'SIGTERM', 'workerExit', { code: code, signal: signal })
    })
    this._workers[index] = worker
}

Master.prototype.run = function () {
    this._cluster.setupMaster({
        exec: path.join(__dirname, this._listener.shift())

    })
    for (var i = 0; i < this._count.listeners; i++) {
        this._listeners.push(this._cluster.fork({ SUBORDINATE_SECRET: this._secret }))
    }
    console.log(this._listeners[0])
    throw new Error
    cluster.on('exit', function (code, signal) {
        interrupt.assert(code == 0, 'listener error exit')
    })
    if (this._workerCount > 1) {
        for (var i = 0; i < this._count.workers; i++) {
            this._startWorker(i)
        }
    }
}

Master.prototype._message = function (message, socket) {
    if (this._workerCount == 0 && this._workers[message.index] == null) {
        this._startWorker(message.index)
    }
    this._workers[message.index].worker.send(message, socket)
}

module.exports = Master