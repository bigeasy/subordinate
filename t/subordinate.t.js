require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var Subordinate = require('../subordinate')
    assert(Subordinate, 'require')
}
