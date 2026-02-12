const { ERROR_CODES } = require('../constants/error-codes')
const {
    getTeamIdOr400,
    getWeekendIdOr400,
    getWeekendOr404,
    invalidInputErrorMessage,
} = require('../utils/request-validators')
const { initialiseSetupVersion } = require('../models/setupVersions.model')
const { teams } = require('../data/teams.data')
const { setupVersions } = require('../data/setupVersions.data')

/**
 * POST /teams/:teamId/weekends/:weekendId/setupVersions
 * Body { changeRequestId, parameters, createdBy, createdByRole }
 */
function createSetupVersion(req, res) {
    const teamId = getTeamIdOr400(req, res)
    const weekendId = getWeekendIdOr400(req, res)
    // Stop if either id is invalid, the error response would have been sent in the getTeamId/ 
    if (teamId === null || weekendId === null) { return }

    // Make sure the team exists before searching
    const teamExists = teams.some((team) => team.id === teamId)
    if (!teamExists) {
        return res.status(404).json({ 'error': { 'code': ERROR_CODES.NOT_FOUND, 'message': 'Team not found' } })
    }

    // pull body fields (no deep validation here)
    const {
        changeRequestId = null,
        parameters,
        createdBy,
        createdByRole,
    } = req.body || {}


    // Find the weekend that matches both teamId and weekendId
    const weekend = getWeekendOr404(res, teamId, weekendId)
    if (!weekend) { return }


    try {
        const setupVersion = initialiseSetupVersion({
            teamId,
            weekendId,
            changeRequestId,
            parameters,
            createdBy,
            createdByRole,
        })
        setupVersions.push(setupVersion)
        return res.status(201).json(setupVersion)
    } catch (err) {
        // model throw -> controller converts to 400
        return invalidInputErrorMessage(res, err.message || 'Invalid input')
    }
}

module.exports = {
    createSetupVersion,
}