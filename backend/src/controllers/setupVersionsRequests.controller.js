const {
    isCorrectStage,
    isToLeadEngineer,
} = require('../models/setupVersionsRequests.model')

const {
    parsePositiveIntId,
    requireNonEmptyObject,
    requireNonEmptyString,
} = require('../utils/request-validators')

const setupVersionsRequestsService = require('../services/setupVersionsRequests.service')

exports.createSetupVersionRequest = (req, res) => {

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
     *  requestedBy
     *      must be string with not just whitespace
     *  requestedByRole
     *      must be string with not just whitespace
     *  requestedTo
     *      must be string with not just whitespace
     *  requestedToRole
     *      must be string with not just whitespace
     */

    let { teamId, weekendId } = req.params

    // pull body fields (no deep validation here)
    let {
        parameters,
        requestedBy,
        requestedByRole,
        requestedTo,
        requestedToRole,
    } = req.body || {}


    try {
        // teamId and weekendId shape validation
        teamId = parsePositiveIntId(teamId, 'team')
        weekendId = parsePositiveIntId(weekendId, 'weekend')

        // String shape validation (requestedBy, requestedByRole, requestedTo, requestedToRole)
        requestedBy = requireNonEmptyString(requestedBy, 'requestedBy')
        requestedByRole = requireNonEmptyString(requestedByRole, 'requestedByRole')
        requestedTo = requireNonEmptyString(requestedTo, 'requestedTo')
        requestedToRole = requireNonEmptyString(requestedToRole, 'requestedToRole')

        // Parameters shape validation: Must be a non-empty plain object (not null, not an array)
        parameters = requireNonEmptyObject(parameters, 'parameters')

        const request = setupVersionsRequestsService.createSetupVersionRequest(teamId, weekendId, requestedBy, requestedByRole, requestedTo, requestedToRole, parameters)

        return res.status(201).json(request)
    } catch (err) {
        if (['INVALID_ID', 'INVALID_OBJECT', 'INVALID_STRING', 'INVALID_ROLE'].includes(err.code))
            return res.status(400).json({ error: { code: 400, message: err.message } })

        if (['TEAM_NOT_FOUND', 'WEEKEND_NOT_FOUND'].includes(err.code))
            return res.status(404).json({ error: { code: 404, message: err.message } })

        if (err.code === 'INVALID_STAGE')
            return res.status(409).json({ error: { code: 409, message: err.message } })

        // Any other error is unexpected (bug, system issue, etc.)
        return res.status(500).json({
            error: { code: 500, message: 'Internal server error' }
        })
    }







    // Make sure the team exists before searching
    const teamExists = teamExistsById(teamId)
    if (!teamExists) {
        return res.status(404).json({ 'error': { 'code': ERROR_CODES.NOT_FOUND, 'message': 'Team not found' } })
    }



    // Find the weekend that matches both teamId and weekendId
    const weekend = getWeekendOr404(res, teamId, weekendId)
    if (!weekend) { return }

    // check that we are in qualifying or race
    if (!isCorrectStage(weekend.stage)) {
        return res.status(409).json({ 'error': { 'code': ERROR_CODES.INVALID_TRANSITION, 'message': 'Can only request setup change during Qualifying or Race' } })
    }

    // check that requestToRole is lead engineer
    if (!isToLeadEngineer(requestedToRole)) {
        return res.status(409).json({ 'error': { 'code': ERROR_CODES.INVALID_TRANSITION, 'message': 'Can only request setup change to leqd engineer' } })
    }


    // check that lead engineer requestTo exists

    // send request to lead engineer


    // if (!canCreateSetup(weekend.stage)) {
    //     return res.status(409).json({ 'error': { 'code': ERROR_CODES.INVALID_TRANSITION, 'message': 'Can only change setup during Practice or Qualifying' } })
    // }

    // try {
    //     const setupVersion = initialiseSetupVersion({
    //         teamId,
    //         weekendId,
    //         changeRequestId,
    //         parameters,
    //         createdBy,
    //         createdByRole,
    //     })
    //     setupVersions.push(setupVersion)
    //     return res.status(201).json(setupVersion)
    // } catch (err) {
    //     // model throw -> controller converts to 400
    //     return invalidInputErrorMessage(res, err.message || 'Invalid input')
    // }

}