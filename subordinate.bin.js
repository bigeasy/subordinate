/*
    ___ usage ___ en_US ___
    usage: subordinate <options> [worker]

    options:

    -k, --key <string>

        Either a JavaScript expression or the name of a module that exports an
        extracotr function. The expression will be evaulated as a JavaScript
        function that accepts a single `$` parameter.

        If the character `$` is present in the value it will evaluated as a
        JavaScript expression, otherwise it will be loaded as a module.

        The `$` parameter is an object with the properties `headers`, `method`,
        `url`, `path`, and `parts`. `headers` is an object containing request
        headers. `method` is the request method. `url` is the parsed url. `path`
        is the path of the url. `parts` is an array containing the path split
        on `/` with the leading empty string removed.

        If you choose to provide a module it will receive the object `$`
        describe above. It should return a JSON

    -b, --bind <string>

        The port or unix domain socket to bind to.

        If the bind argument begins with a `.` or `/` it will be interpreted as
        a path to a domain socket.

    -w, --workers <number>

    -s, --secret <string>

        Secret used to authenticate specific worker routing. Exposing workers by
        index will not be commonly useful, but it is needed sometimes during
        development.

    ___ $ ___ en_US ___

    ___ . ___
*/
require('arguable')(module, require('cadence')(function (async, program) {
    var coalesce = require('extant')
    var crypto = require('crypto')
    var Cluster = require('./cluster')
    if (!/^[\/.]/.test(program.ultimate.bind)) {
        program.validate(require('arguable/bindable'), 'bind')
    }
    async(function () {
        var secret = coalesce(program.env.SUBORDINATE_SECRET, program.ultimate.secret)
        if (secret) {
            return [ secret ]
        }
        async(function () {
            crypto.randomBytes(256, async())
        }, function (buffer) {
            return [ buffer.toString('hex') ]
        })
    }, function (secret) {
        var cluster = new Cluster(program, secret)
        cluster.run(async())
        program.on('shutdown', cluster.destroy.bind(cluster))
    })
}))
