require('proof')(1, require('cadence')(prove))

function prove (async, assert) {
    var events = require('events')

    var Subordinate = require('../subordinate')
    assert(Subordinate, 'require')

    var subordinate = new Subordinate({})
}
