'use strict'

require('proof')(16, okay => {
    const subordinate = require('..')

    okay(subordinate('1', '1'), 'strings')
    okay(!subordinate(1, '1'), 'strings fail')
    okay(subordinate(1, 1), 'numbers')
    okay(subordinate({}, {}), 'empty objects')
    okay(subordinate({ code: 'ENOENT' }, {}), 'empty object as subset')
    okay(!subordinate({}, { code: 'ENOENT' }), 'object subset miss')
    okay(subordinate({ code: 'ENOENT' }, { code: /ENOENT/ }), 'nested regex hit')
    okay(!subordinate({ code: 'EBADFD' }, { code: /ENOENT/ }), 'nested regex hit')
    okay(subordinate([ 1, 2, 3 ], [ 1, 2, 3 ]), 'array equal')
    okay(subordinate([ 1, 2, 3 ], [ 1, 2, 3 ], { length: 3 }), 'array equal')
    okay(!subordinate([ 1, 2 ], [ 1, 2, 3 ]), 'array does not contain')
    okay(subordinate([ 1, 2, 2, 3 ], [ 1, 2, 3 ]), 'array contains subset')
    okay(subordinate(/a/, /a/), 'compare regex')
    okay(subordinate(NaN, NaN), 'compare NaN')
    okay(subordinate(new Date(0), new Date(0)), 'compare Date')
    okay(subordinate(null, () => true), 'run function')
})
