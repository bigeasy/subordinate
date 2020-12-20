'use strict'

function examine (expect, object) {
    if (expect === object) {
        return true
    }

    if (expect.constructor === RegExp && object != null) {
        if (object.constructor !== RegExp) {
            return expect.test(String(object))
        }
    }

    if (typeof expect == 'function') {
        return expect(object)
    }

    if (expect && object && typeof expect == 'object' && typeof object == 'object') {
        if (Array.isArray(expect)) {
            let j = 0, J = object.length
            for (let i = 0, I = expect.length; i < I; i++) {
                for (;;) {
                    if (j == J) {
                        return false
                    }
                    if (examine(expect[i], object[j++])) {
                        break
                    }
                }
            }
            return true
        }

        if (expect.constructor === RegExp) {
            return expect.source === object.source && expect.flags === object.flags
        }

        if (
            expect.constructor === object.constructor &&
            expect.valueOf !== Object.prototype.valueOf
        ) {
            return expect.valueOf() === object.valueOf()
        }

        const keys = Object.keys(expect)
        for (let i = 0, I = keys.length; i < I; i++) {
            if (!Object.prototype.hasOwnProperty.call(object, keys[i])) {
                return false
            }
        }

        for (let i = 0, I = keys.length; i < I; i++) {
            const key = keys[i]

            if (!examine(expect[key], object[key])) {
                return false
            }
        }

        return true
    }

    return expect !== expect && object !== object
}

module.exports = function (object, ...vargs) {
    for (const pattern of vargs) {
        if (!examine(pattern, object)) {
            return false
        }
    }
    return true
}
