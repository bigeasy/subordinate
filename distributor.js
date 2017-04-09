var url = require('url')
var fnv = require('hash.fnv')
var coalesce = require('extant')

function Distributor (secret, workers, keys) {
    this._secret = secret
    this._workers = workers
    this._keys = keys.map(function (key) {
        if (~key.indexOf('$')) {
            return new Function('$', 'return ' + key)
        } else {
            return require(key)
        }
    })
}

Distributor.prototype.distribute = function (request) {
    if (('x-subordinate-index' in request.headers)) {
        if (request.headers['x-subordinate-secret'] != this._secret) {
            throw 403
        }
        var index = parseFloat(request.headers['x-subordinate-index'])
        if (isNaN(index) || (index | 0) !== index) {
            throw 400
        }
        if (index >= this._workers) {
            throw 400
        }
        return {
            key: null,
            hash: null,
            index: +request.headers['x-subordinate-index']
        }
    }
    var key = JSON.stringify(this._keys.map(function (f) {
        var parsed = url.parse(request.url)
        return coalesce(f({
            headers: request.headers,
            url: request.url,
            parsed: parsed,
            query: url.parse(request.url, true).query,
            parts: parsed.pathname.split('/').splice(1)
        }))
    }))
    var buffer = new Buffer(key)
    var hash = fnv(0, key, 0, key.length)
    var index = hash % this._workers
    return { key: key, hash: hash, index: index }
}

module.exports = Distributor
