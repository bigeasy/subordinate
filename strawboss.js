// Return the first not null-like value.
var coalesce = require('extant')

// Control-flow utilities.
var delta = require('delta')
var cadence = require('cadence')
var Signal = require('signal')

// Node.js utilities.
var children = require('child_process')

// Controlled demolition of objects.
var Destructible = require('destructible')

// Exceptions that you can catch by type.
var interrupt = require('interrupt').createInterrupter('subordinate')

// Contextualized callbacks and event handlers.
var Operation = require('operation/variadic')

function StrawBoss (options) {
    var argv = options.argv.slice()
    this._subordinate = {
        command: argv.shift(),
        argv: argv,
        count: coalesce(options.subordinates, 1),
        array: []
    }
    this._process = coalesce(options.process)
    this._destructible = new Destructible('strawboss')
    this._destructible.markDestroyed(this)
    this._destructible.addDestructor('kill', this, '_kill')
}

StrawBoss.prototype._kill = function () {
    this._subordinate.array.forEach(function (subordinate) { subordinate.kill() })
}

StrawBoss.prototype.destroy = function () {
    this._destructible.destroy()
}

StrawBoss.prototype.send = function (message, handle) {
    this._subordinate.array.forEach(function (subordinate) {
        subordinate.send(message, coalesce(handle))
    })
}

StrawBoss.prototype.sendTo = function (index, message, handle) {
    this._subordinate.array[index].send(message, coalesce(handle))
}

// TODO Starting workers as requested for pipelines would be done here now.
StrawBoss.prototype.message = function (message, handle) {
    if (message.module == 'subordinate') {
        this._subordinate.array[message.index].send(message, coalesce(handle))
    } else if (this._process.send != null) {
        this._process.send(message, coalesce(handle))
    }
}

StrawBoss.prototype.run = cadence(function (async) {
    for (var i = 0; i < this._subordinate.count; i++) {
        var subordinate = children.spawn(this._subordinate.command, this._subordinate.argv, {
            stdio: [ 0, 1, 2, 'ipc' ]
        })
        this._subordinate.array[i] = subordinate
        subordinate.on('message', Operation([ this, 'message' ]))
        async(function () {
            delta(async()).ee(subordinate).on('exit')
        }, function (code, signal) {
            console.log(code, signal, this.destroyed)
            interrupt.assert(this.destroyed, 'subordinate.exit', { code: code, signal: signal })
            return []
        })
    }
})

module.exports = StrawBoss
