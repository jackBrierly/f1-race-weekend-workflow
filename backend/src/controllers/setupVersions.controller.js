const { ERROR_CODES } = require('../constants/error-codes')
const {
    getTeamIdOr400,
    getWeekendIdOr400,
    getWeekendOr404,
    invalidInputErrorMessage,
    parsePositiveIntId,
    requireNonEmptyObject,
    requireNonEmptyString,
} = require('../utils/request-validators')
const setupVersionsService = require('../services/setupVersions.service')
const { initialiseSetupVersion, canCreateSetup } = require('../models/setupVersions.model')
const setupVersionsData = require('../data/setupVersions.data')
const { teamExistsById } = require('../data/teams.data')
const { weekendExistsForTeam } = require('../data/weekends.data')
const { setupVersions } = require('../data/setupVersions.data')

/**
 * POST /teams/:teamId/weekends/:weekendId/setupVersions
 * Body { changeRequestId, parameters, createdBy, createdByRole }
 */
function createSetupVersion(req, res) {

    /**
     * Shape Validation:
     * params:
     *  teamId
     *      must be integer > 0
     *  weekendId
     *      must be integer > 0
     * body:
     *  parameters
     *      must be an object
     *  createdBy
     *      must be string with not just whitespace
     *  createdByRole
     *      must be string with not just whitespace
     */

    // pull params
    let { teamId, weekendId } = req.params
    // pull body
    let {
        parameters,
        createdBy,
        createdByRole,
        setupVersionRequestId,
    } = req.body || {}

    try {
        teamId = parsePositiveIntId(teamId, 'team')
        weekendId = parsePositiveIntId(weekendId, 'weekend')
        if (setupVersionRequestId !== null){
            setupVersionRequestId = parsePositiveIntId(setupVersionRequestId, 'setupVersionRequest')
        }

        // String shape validation
        createdBy = requireNonEmptyString(createdBy, 'createdBy')
        createdByRole = requireNonEmptyString(createdByRole, 'createdByRole')

        // Parameters shape validation: Must be a non-empty plain object (not null, not an array)
        parameters = requireNonEmptyObject(parameters, 'parameters')

        const setupVersion = setupVersionsService.createSetupVersion(teamId, weekendId, parameters, createdBy, createdByRole, setupVersionRequestId)

        return res.status(201).json(setupVersion)
    } catch (err) {
        if (['INVALID_ID', 'INVALID_OBJECT', 'INVALID_STRING', 'INVALID_ROLE', 'INVALID_USER', 'INVALID_REQUEST_STATUS'].includes(err.code))
            return res.status(400).json({ error: { code: 400, message: err.message } })

        if (['TEAM_NOT_FOUND', 'WEEKEND_NOT_FOUND', 'SETUP_VERSION_REQUEST_NOT_FOUND'].includes(err.code))
            return res.status(404).json({ error: { code: 404, message: err.message } })

        if (err.code === 'INVALID_STAGE')
            return res.status(409).json({ error: { code: 409, message: err.message } })

        // Any other error is unexpected (bug, system issue, etc.)
        return res.status(500).json({
            error: { code: 500, message: err.message }
        })
    }
}

function listSetupVersionsForWeekend(req, res) {
    let { teamId, weekendId } = req.params

    try {
        teamId = parsePositiveIntId(teamId, 'team')
        weekendId = parsePositiveIntId(weekendId, 'weekend')

        // service
        // weekend exists for team
        // teamId must exist
        if (!teamExistsById(teamId)) {
            const err = new Error('Team not found')
            err.code = 'TEAM_NOT_FOUND'
            throw err
        }

        // weekendId must exist for this team
        if (!weekendExistsForTeam(weekendId, teamId)) {
            const err = new Error('Weekend not found for this team')
            err.code = 'WEEKEND_NOT_FOUND'
            throw err
        }

        const setupVersionsRequestsForWeekend = setupVersionsData.listSetupVersionsForWeekend(weekendId)
        return res.status(200).json(setupVersionsRequestsForWeekend)
    } catch (err) {
        if (err.message === 'INVALID_ID') {
            return res.status(404).json({ error: { code: 400, message: err.message } })
        }
        if (['TEAM_NOT_FOUND', 'WEEKEND_NOT_FOUND'].includes(err.code))
            return res.status(404).json({ error: { code: 404, message: err.message } })
        return res.status(500).json({ error: { code: 500, message: err.message } })

    }

}

module.exports = {
    createSetupVersion,
    listSetupVersionsForWeekend,
}
