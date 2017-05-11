require('proof')(1, prove)

function prove (assert) {
    var listener = require('../listener')
    assert(!! listener, 'required')
}
