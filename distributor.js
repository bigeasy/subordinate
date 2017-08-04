// Node.js API.
var url = require('url')

// Pretty good, very simple 32-bit hash function.
var fnv = require('hash.fnv')

// Return the first not null-like value.
var coalesce = require('extant')

function Distribution (distributor, key, hash, index) {
    this._distributor = distributor
    this.key = key
    this.hash = hash
    this.index = index
}

Distribution.prototype.setHeaders = function (set) {
    if (this.key != null) {
        set('x-subordinate-key', String(this.key))
    }
    if (this.hash != null) {
        set('x-subordinate-hash', String(this.hash))
    }
    set('x-subordinate-index', String(this.index))
    set('x-subordinate-from', String(this._distributor.index))
    set('x-subordinate-workers', String(this._distributor._workers))
    set('x-subordinate-secret', String(this._distributor.secret))
}

// Construct a distributor. The secret is used to authorize selecting a specific
// index overridding the hash. Workers is the count of workers used to select a
// worker index from a hashed key. Keys is an array of functions that extract
// key material from HTTP headers

//
function Distributor (options) {
    this.index = options.index
    this.secret = options.secret
    this._workers = options.workers
    this._keys = options.keys.map(function (key) {
        if (~key.indexOf('$')) {
            return new Function('$', 'return ' + key)
        } else {
            return require(key)
        }
    })
}

// When we're given a valid secret, we will allow the caller to specify the
// index of a specific worker instead of hashing.

// Otherwise we create a hash by first using the user supplied extractor
// functions to extract key material from the header. We pass an object to each
// function. The object contains the header properties raw and a few properties
// parsed out of the raw headers. The return value of of a key extractor
// function better be a JSON object because it is going to be serialized as JSON
// for use as a hash key. `undefined` is coaleseced to `null`.
//
// The hash of the JSON value of the extractor keys is used to choose the index
// of a worker.

//
Distributor.prototype.distribute = function (request) {
    if ('x-subordinate-index' in request.headers) {
        if (request.headers['x-subordinate-secret'] != this.secret) {
            throw 403
        }
        var index = parseFloat(request.headers['x-subordinate-index'])
        if (isNaN(index) || (index | 0) !== index) {
            throw 400
        }
        if (index >= this._workers) {
            throw 400
        }
        return new Distribution(this, null, null, +request.headers['x-subordinate-index'])
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

    return new Distribution(this, key, hash, index)
}

// Module as function export.
module.exports = Distributor
