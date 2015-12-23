var cadence = require('cadence')
var Reactor = require('reactor')
var Operation = require('operation')

function Listener (object, delegations, process) {
    this._delegations = {}
    for (var method in delegations) {
        this._delegations[method] = new Operation({ object: object, method: delegations[method] })
    }
    this._listener = this._message.bind(this)
    this._process = process
    this._process.on('message', this._listener)
    this._invoking = new Reactor({ object: this, method: '_request' })
}

// TODO Note that, unlike an HTTP server, we don't want to treat errors as
// recoverable, we don't want to log them, we do want to crash. This is an IPC
// mechanism. The operation that is in invoked here has already been
// successfully transmitted. If it raises an exception, it is not a run time
// error, it is a bug. Unlike an HTTP server, there is no way for someone to
// fuzz this socket. If the messages between parent and child are incorrect,
// that should be treated as a bug, resolved as a bug, not swallowed and logged.

//
Listener.prototype._request = cadence(function (async, timeout, message) {
    if (message.namespace == 'bigeasy.subordinate') {
        var delegate = this._delegations[message.method]
        if (delegate) {
            async(function () {
                delegate.apply([ message.body, async() ])
            }, function (body) {
                this._process.send({
                    namespace: 'bigeasy.subordinate',
                    type: 'response',
                    cookie: message.cookie,
                    body: body
                })
            })
        }
    }
})

Listener.prototype._message = function (message) {
    this._invoking.push(message)
}

Listener.prototype.unlisten = function () {
    this._process.removeListener('message', this._listener)
}

function Dispatcher (object) {
    this._object = object
    this._delegations = {}
}

Dispatcher.prototype.dispatch = function (method, delegate) {
    if (delegate == null) delegate = method
    this._delegations[method] = delegate
}

Dispatcher.prototype.listen = function (process) {
    return new Listener(this._object, this._delegations, process)
}

module.exports = Dispatcher
