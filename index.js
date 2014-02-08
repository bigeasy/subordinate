module.exports = function (object, subobject) { return compare(object, subobject) }

function compare (actual, expect) {
    if (expect === actual) return true
    if (actual == null) return false
    if (Array.isArray(expect)) {
        if (!Array.isArray(actual)) return false
        if (expect.length != actual.length) return false
        return expect.every(function (item, index) {
            return item === actual[index]
        })
    }
    if (!(typeof expect == 'object')) return false
    for (var key in expect) {
        if (!(key in actual)) return false
        if (!compare(actual[key], expect[key])) return false
    }
    return true
}
