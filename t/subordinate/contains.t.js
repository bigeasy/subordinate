require('proof')(4, function (ok) {
    var contains = require('../..')
    ok(contains({ a: 1, b: 2 }, { a: 1 }), 'integers')
    ok(contains({ a: null, b: 2 }, { a: null }), 'nulls')
    var b = { a: 1 }
    ok(contains({ a: b, b: 2 }, { a: b }), 'same')
    ok(!contains({ b: 2 }, { a: b }), 'missing')
})
