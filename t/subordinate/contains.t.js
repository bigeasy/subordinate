require('proof')(8, function (ok) {
    var contains = require('../..')
    ok(contains({ a: 1, b: 2 }, { a: 1 }), 'integers')
    ok(contains({ a: null, b: 2 }, { a: null }), 'nulls')
    var b = { a: 1 }
    ok(contains({ a: b, b: 2 }, { a: b }), 'same')
    ok(!contains({ b: 2 }, { a: 1 }), 'missing')
    ok(!contains({ a: 2, b: 2 }, { a: 1 }), 'wrong value')
    ok(contains({ a: [ 1, 2 ], b: 2 }, { a: [ 1, 2 ] }), 'array')
    ok(!contains({ a: 1, b: 2 }, { a: [ 1 ] }), 'array not array')
    ok(!contains({ a: [ 1, 2 ], b: 2 }, { a: [] }), 'array wrong length')
})
