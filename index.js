var subordinate = module.exports = function (object, subobject) {
    for (var key in subobject) {
        var expect = subobject[key]
        var actual = object[key]
        if (expect !== actual) {
            if (actual == null) return false
            if (Array.isArray(expect)) {
                if (!Array.isArray(actual)) return false
                if (expect.length != actual.length) return false
                return expect.every(function (item, index) {
                    return item === actual[index]
                })
            }
            return false
        }
    }
    return true
}
