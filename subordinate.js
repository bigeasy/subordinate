// Node.js API.
var assert = require('assert')

// Control-flow utilites.
var cadence = require('cadence')
var abend = require('abend')

// Container for Sencha Connect middleware.
var Interlocutor = require('interlocutor')

// Return the first not null-like value.
var coalesce = require('extant')

// Contextualized callbacks and event handlers.
var Operation = require('operation/redux')

// Controlled demolition of objects.
var Destructible = require('destructible')

// Raw-socket multiplexing and network patterns.
var Conduit = require('conduit')
var Server = require('conduit/server')

// Exceptions that you can catch by type.
var interrupt = require('interrupt').createInterrupter('subordinate')

// An HTTP responder for a paritcular peer socket.
var Responder = require('./responder')

// Construct a `Subordinate` with Sencha Connect middleware and an optional

//
function Subordinate (options) {
    this._responders = {}
    this._destructible = new Destructible
    this._interlocutor = new Interlocutor(options.middleware)
    this._connect = coalesce(options.connect)
    this._responders = {}
    this._process = coalesce(options.process, process)

    var ee = this._process, messages
    ee.on('message', messages = Operation({ object: this, method: '_message' }))
    this._destructible.addDestructor('messages', function () {
        console.log('---> removeListener')
        ee.removeListener('message', messages)
    })
}

// TODO Wondering if `Destructible` shouldn't have some sort of event to
// indicate that everything has shutdown. You can wait here or get a report
// elsewhere. Beginning of a pattern for chaining these events. Always invoke an
// object with a long running method with an error-first callback that will
// receive the error that brought down the object. Here we have a special case
// where we're adding long running processes. This starts to feel like a job for
// Turnstile or a turnstile like object where you have a long running, or never
// ending process.
//
// You're getting muddled by designing this based on Prolific. The Prolific
// Shuttle is supposed to be unobtrusive and Prolific's inter-process
// communication should be magical and opaque to the application developer. It
// has that cross-cutting concern air about it.
//
// Subordinate will define a program.
//
// As I consider it, it makes sense to have some sort of Signal that all stacks
// and wrapped operations can be tracked and that there is some way to watch for
// the unwinding of all stacks and receive the error. Currently, I'm using
// cadence to do this, but starting an anonymous cadence and passing abend.
//
// The `unwound` function would be invoked when the last stack is unwound. It is
// never invoked if a stack is never created. Rescue doesn't trigger unwound
// unless we are destroyed, because it does cause `unwound` not to fire as it is
// outstanding work.
//
// Ah, `unwound` will get called if `destroy` is called.


Subordinate.prototype._responder = cadence(function (async, message, socket) {
    var responder = this._responders[message.from] = new Responder(this._interlocutor)
    this._destructible.addDestructor([ 'responder', message.from ], responder, 'destroy')
    responder.listen(socket, async())
})

Subordinate.prototype._message = function (message, socket) {
    if (message.module != 'subordinate') {
        return
    }
    console.log('MESSSAGE')
    this._destructible.addDestructor([ 'socket', socket.remoteAddress + ':' + socket.remotePort ], socket, 'destroy')
    if (message.method == 'middleware') {
        console.log(message)
        assert(this._responders[message.from] == null)
        this._responder(message, socket, this._destructible.monitor([ 'responer', message.from ]))
    } else {
        var buffer = new Buffer(message.buffer, 'base64')
        this._connect.call(null, message.body, socket, buffer)
    }
}

Subordinate.prototype.reassign = function () {
    var vargs = Array.prototype.slice.call(arguments), index = null
    if (typeof vargs[0] == 'number') {
        index = vargs.shift()
    }
    var request = vargs.shift()
    var socket = vargs.shift()
    var buffer = coalesce(vargs.shift(), new Buffer(0))
    // The user can only send stuff that would fit in the headers of an HTTP
    // reqeust. If they have structured data, they can serialize to JSON and use
    // a request header. If they have binary data they can serialize to base 64
    // and use a request header. This does not accommodate a lot of data. It
    // shouldn't. It's going to go through `process.send`, after all.
    this._process.send({
        module: 'subordinate',
        method: 'socket',
        index: index,
        buffer: buffer.toString('base64'),
        body: {
            httpVersion: request.httpVersion,
            headers: request.headers,
            url: request.url,
            method: request.method,
            rawHeaders: coalesce(request.rawHeaders, [])
        }
    }, socket)
}

Subordinate.prototype.listen = cadence(function (async) {
    this._destructible.completed(1000, async())
})

Subordinate.prototype.destroy = function () {
    this._destructible.destroy()
}

module.exports = Subordinate
