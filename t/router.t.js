require('proof')(1, prove)

function prove (assert) {
    var Router = require('../router')
    assert(!! Router, 'required')
}
