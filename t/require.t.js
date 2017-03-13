require('proof/redux')(1, prove)

function prove (assert) {
    var Subordinate = require('..')
    assert(Subordinate, 'required')
}
