#!/usr/bin/env node

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
    -r, --routers <number>

    -s, --secret <string>

        Secret used to authenticate specific worker routing. Exposing workers by
        index will not be commonly useful, but it is needed sometimes during
        development.

    ___ $ ___ en_US ___

    ___ . ___
*/
require('arguable')(module, require('cadence')(function (async, program) {
    var crypto = require('crypto')

    var Signal = require('signal')
    var coalesce = require('extant')

    var fixup = require('./fixup')

    var ready = coalesce(program.ready, new Signal)

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
        program.validate(require('arguable/bindable'), 'bind')

        var Destructible = require('destructible')
        var destructible = new Destructible('subordinate x')

        program.on('shutdown', destructible.destroy.bind(destructible))

        var StrawBoss = require('./strawboss')
        var strawboss = new StrawBoss({
            argv: program.argv.slice(),
            process: program,
            subordinates: +program.ultimate.workers
        })

        destructible.addDestructor('strawboss', strawboss, 'destroy')

        var Thereafter = require('thereafter')
        var thereafter = new Thereafter

        var cluster = require('cluster')
        var messages
        cluster.on('message', messages = fixup(function (message, handle) {
            console.log(message)
            strawboss.sendTo(message.to, message, handle)
        }))
        destructible.addDestructor('message', function () {
            program.removeListener('message', messages)
        })

        var Listener = require('./listener')
        var listener = new Listener

        destructible.addDestructor('listener', listener, 'destroy')

        thereafter.run(function (ready) {
            strawboss.run(destructible.monitor('strawboss'))
            ready.unlatch()
        })

        var path = require('path')

        thereafter.run(function (ready) {
            var argv = [
                path.join(__dirname, 'router.bin.js'),
                '--workers', program.ultimate.workers,
                '--secret', secret,
                '--bind', String(program.ultimate.bind),
                '--workers', program.ultimate.workers
            ]
            program.grouped.key.forEach(function (key) {
                argv.push('--key', key)
            })
            listener.run(+program.ultimate.routers, argv, function (index) {
                var env = JSON.parse(JSON.stringify(program.env))
                env.SUBORDINATE_LISTENER_INDEX = index
                return env
            }, async())
            ready.unlatch()
        })

        thereafter.ready.wait(ready, 'unlatch')

        destructible.addDestructor('done', function () { console.log('done') })

        destructible.completed(1000, async())
    }, function () {
        console.log('xxxxxx')
    })
}))
