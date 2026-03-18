const { ERROR_CODES } = require('../constants/error-codes')

// Standard error response for invalid input
function invalidInputErrorMessage(res, message) {
    return res.status(400).json({ 'error': { 'code': ERROR_CODES.BAD_REQUEST, 'message': message } })
}

function parsePositiveIntId(id, idType) {
    const idStr = String(id)

    if (!/^\d+$/.test(idStr)) {
        const err = new Error(`${idType} id must be a positive integer`)
        err.code = "INVALID_ID"
        throw err
    }

    const idNum = Number(idStr)

    if (idNum <= 0) {
        const err = new Error(`${idType} id must be a positive integer`)
        err.code = "INVALID_ID"
        throw err
    }

    return idNum
}

function requireNonEmptyString(value, fieldName) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        const err = new Error(`${fieldName} must be a non-empty string`)
        err.code = 'INVALID_STRING'
        throw err
    }

    return value.trim()
}

function requireNonEmptyObject(value, fieldName) {
    if (
        value === null ||
        typeof value !== 'object' ||
        Array.isArray(value) ||
        Object.keys(value).length === 0
    ) {
        const err = new Error(`${fieldName} must be a non-empty object`)
        err.code = 'INVALID_OBJECT'
        throw err
    }

    return value
}
module.exports = {
    parsePositiveIntId,
    requireNonEmptyString,
    requireNonEmptyObject,
    invalidInputErrorMessage,
}
