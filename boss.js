var path = require('path')
var cadence = require('cadence')
var Vestibule = require('vestibule')

// TODO So I'm really going to double down on the notion that processes
// shouldn't exit, they are threads and should run as long as the process runs,
// because that is what the C10K architecture. What's on my mind is the Apache
// MPM configuration that would allow you to specify a restart after a
// certain number of requests in case you had process that was leaking memory.
// This must have been the case quite often with their plug-in architecture that
// had people linking all kinds of hell into the Apache binary. The C10K
// architecture creates a handful of long running workers. You're not going to
// be able to solve leak problems by restarting these workers, you're going to
// have to restart the process group, or better still, don't leak. I'm not
// concerned about leaks because my processes tend to be small so that leaks are
// not hard to find.
//
// If it really was a problem, I'd make the process group short lived and at a
// devops level migrate from one instance of the service to another. Thus, I'm
// not going to clutter this with a bunch of restart logic that I'm never going
// to use.

//
function Boss (children) {
    this.children = children
    this.stopped = new Vestibule
}

Boss.prototype.start = cadence(function (async, monitor) {
    async(function () {
        this.children.forEach(function (child, index) {
            async(function () {
                monitor(child, index, async())
            }, function () {
                this.stop()
            })
        })
    }, function () {
        this.stopped.notify()
    })
})

Boss.prototype.stop = function () {
    this.children.forEach(function (child) { child.kill() })
}

module.exports = Boss
