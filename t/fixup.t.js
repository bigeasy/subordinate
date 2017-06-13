require('proof')(2, prove)

function prove (assert) {
    var fixup = require('../fixup')
    fixup(function (message, handle) {
        assert({
            message: message,
            handle: handle
        }, {
            message: 0,
            handle: 1
        }, 'two arguments')
    })(0, 1)
    fixup(function (message, handle) {
        assert({
            message: message,
            handle: handle
        }, {
            message: 1,
            handle: 2
        }, 'three arguments')
    })(0, 1, 2)
}
