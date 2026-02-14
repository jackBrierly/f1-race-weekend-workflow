const { findWeekendByTeamAndId } = require('../data/weekends.data')

const { ERROR_CODES } = require('../constants/error-codes')

// Standard error response for invalid input
function invalidInputErrorMessage(res, message) {
    return res.status(400).json({ 'error': { 'code': ERROR_CODES.BAD_REQUEST, 'message': message } })
}

// Get and validate Teams ID from the URL
function getTeamIdOr400(req, res) {
    // Read the teamId from the URL params (eg /teams/1/weekends)
    // Convert to integer if string, NaN if not possible
    // As teamId often comes from params, it will always be a string
    const teamIdStr = String(req.params.teamId)

    // If teamIdStr is not made of of only digits, reject it.
    if (!/^\d+$/.test(teamIdStr)) {
        invalidInputErrorMessage(res, 'Team id must be a positive integer')
        return null
    }

    const teamId = Number(teamIdStr)
    // If teamId is missing, not a number, or <= 0, return a 400 error
    if (!Number.isInteger(teamId) || teamId <= 0) {
        invalidInputErrorMessage(res, 'Team id must be a positive integer')
        // Return null so the caller can stop
        return null
    }
    return Number(teamIdStr)
}

// Get and validate Weekends ID from the URL
function getWeekendIdOr400(req, res) {
    const weekendIdStr = String(req.params.weekendId)

    // If teamIdStr is not made of of only digits, reject it.
    if (!/^\d+$/.test(weekendIdStr)) {
        invalidInputErrorMessage(res, 'Weekend id must be a positive integer')
        return null
    }

    return Number(weekendIdStr)
}

// Find a weekend by teamId and weekendId or return a 404
function getWeekendOr404(res, teamId, weekendId) {
    const weekend = findWeekendByTeamAndId(teamId, weekendId)

    if (!weekend) {
        res.status(404).json({ 'error': { 'code': ERROR_CODES.NOT_FOUND, 'message': 'Weekend not found' } })
        return null
    }
    return weekend
}

module.exports = {
    getTeamIdOr400,
    getWeekendIdOr400,
    getWeekendOr404,
    invalidInputErrorMessage,
}