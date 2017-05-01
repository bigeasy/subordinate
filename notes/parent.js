var cluster = require('cluster')
cluster.setupMaster({ exec: 'listener.js' })
cluster.fork()
