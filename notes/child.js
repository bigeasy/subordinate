var net = require('net')
process.on('message', function (message, handle) {
    switch (message.method) {
    case 'connect':
        var connect = net.connect({
            hostname: '127.0.0.1',
            port: 8888
        })
        connect.on('data', function (data) {
            console.log(data.toString())
        })
        break
    case 'socket':
        handle.write('hello')
        handle.end()
        break
    }
    console.log('message', message)
})
