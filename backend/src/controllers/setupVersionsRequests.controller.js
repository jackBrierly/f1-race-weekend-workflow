const {
    parsePositiveIntId,
    requireNonEmptyObject,
    requireNonEmptyString,
} = require('../utils/request-validators')

const setupVersionsRequestsService = require('../services/setupVersionsRequests.service')

function withErrorHandling(res, fn) {
    try {
        return fn()
    } catch (err) {
        return mapErrorToHttp(res, err)
    }
}


function mapErrorToHttp(res, err) {
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

exports.listSetupVersionsRequestsForWeekend = (req, res) => {
    let { teamId, weekendId } = req.params

    return withErrorHandling(res, () => {
        teamId = parsePositiveIntId(teamId, 'team')
        weekendId = parsePositiveIntId(weekendId, 'weekend')

        const setupVersionsForWeekend = setupVersionsRequestsService.listSetupVersionsRequestsForWeekend(teamId, weekendId)
        return res.status(200).json(setupVersionsForWeekend)
    })
}

exports.acceptSetupVersionRequest = (req, res) => {
    /**
     * Shape Validation:
     * params:
     *  teamId
     *      must be integer > 0
     *  weekendId
     *      must be integer > 0
     *  setupVersionRequestId
     *      must be integer > 0
     * body:
     *  acceptedBy
     *      must be string with not just whitespace
     *  acceptedByRole
     *      must be string with not just whitespace
     */

    let { teamId, weekendId, setupVersionRequestId } = req.params

    // pull body fields (no deep validation here)
    let {
        acceptedBy,
        acceptedByRole,
    } = req.body || {}


    return withErrorHandling(res, () => {
        // teamId and weekendId shape validation
        teamId = parsePositiveIntId(teamId, 'team')
        weekendId = parsePositiveIntId(weekendId, 'weekend')
        setupVersionRequestId = parsePositiveIntId(setupVersionRequestId, 'setupVersionRequest')


        // String shape validation (acceptedBy, accepteddByRole)
        acceptedBy = requireNonEmptyString(acceptedBy, 'acceptedBy')
        acceptedByRole = requireNonEmptyString(acceptedByRole, 'acceptedByRole')

        const request = setupVersionsRequestsService.acceptSetupVersionRequest(teamId, weekendId, setupVersionRequestId, acceptedBy, acceptedByRole)

        // add this setupVerion to setupVersions

        return res.status(201).json(request)
    })
}
exports.declineSetupVersionRequest = (req, res) => {
    /**
     * Shape Validation:
     * params:
     *  teamId
     *      must be integer > 0
     *  weekendId
     *      must be integer > 0
     *  setupVersionRequestId
     *      must be integer > 0
     * body:
     *  acceptedBy
     *      must be string with not just whitespace
     *  acceptedByRole
     *      must be string with not just whitespace
     */

    let { teamId, weekendId, setupVersionRequestId } = req.params

    // pull body fields (no deep validation here)
    let {
        declinedBy,
        declinedByRole,
    } = req.body || {}


    return withErrorHandling(res, () => {
        // teamId and weekendId shape validation
        teamId = parsePositiveIntId(teamId, 'team')
        weekendId = parsePositiveIntId(weekendId, 'weekend')
        setupVersionRequestId = parsePositiveIntId(setupVersionRequestId, 'setupVersionRequest')


        // String shape validation (acceptedBy, accepteddByRole)
        declinedBy = requireNonEmptyString(declinedBy, 'declinedBy')
        declinedByRole = requireNonEmptyString(declinedByRole, 'declinedByRole')

        const request = setupVersionsRequestsService.declineSetupVersionRequest(teamId, weekendId, setupVersionRequestId, declinedBy, declinedByRole)

        return res.status(201).json(request)
    })
}

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


    return withErrorHandling(res, () => {
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
    })
}