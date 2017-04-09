require('proof')(1, prove)

function prove (assert) {
    var Distributor = require('../distributor')
    var distrubutor = new Distributor('x', 3, [ '$.headers["x-object-id"]', './t/key' ])
    assert(distrubutor.distribute({
        headers: {
            'x-object-id': '1'
        },
        url: 'http://127.0.0.1:8080/value'
    }), {
        key: '["1",true]',
        hash: 3807003980,
        index: 2
    }, 'hash')
}
