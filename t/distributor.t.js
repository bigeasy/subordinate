require('proof')(5, prove)

function prove (assert) {
    var Distributor = require('../distributor')
    var distrubutor = new Distributor({
        index: 0,
        secret: 'x',
        workers: 3,
        keys: [ '$.headers["x-object-id"]', './t/key' ]
    })
    var distrubution = distrubutor.distribute({
        headers: {
            'x-object-id': '1'
        },
        url: 'http://127.0.0.1:8080/value'
    })
    assert({
        key: distrubution.key,
        hash: distrubution.hash,
        index: distrubution.index
    }, {
        key: '["1",true]',
        hash: 3807003980,
        index: 2
    }, 'hash')
    try {
        distrubutor.distribute({
            headers: {
                'x-subordinate-index': '1',
                'x-subordinate-secret': 'y'
            }
        })
    } catch (error) {
        assert(error, 403, 'bad secret')
    }
    try {
        distrubutor.distribute({
            headers: {
                'x-subordinate-index': 'x',
                'x-subordinate-secret': 'x'
            }
        })
    } catch (error) {
        assert(error, 400, 'bad index')
    }
    try {
        distrubutor.distribute({
            headers: {
                'x-subordinate-index': '3',
                'x-subordinate-secret': 'x'
            }
        })
    } catch (error) {
        assert(error, 400, 'index out of range')
    }
    var distribution = distrubutor.distribute({
        headers: {
            'x-subordinate-index': '2',
            'x-subordinate-secret': 'x'
        }
    })
    var headers = {}
    distribution.setHeaders(function (name, value) { headers[name] = value })
    assert(headers, {
        'x-subordinate-index': '2',
        'x-subordinate-from': '0',
        'x-subordinate-workers': '3',
        'x-subordinate-secret': 'x'
    }, 'specific index')
}
