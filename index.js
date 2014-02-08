var subordinate = module.exports = function (object, subobject) {
    for (var key in subobject) {
        var expect = subobject[key]
        var actual = object[key]
        if (expect !== actual) {
            if (actual == null) return false
        }
    }
    return true
}
