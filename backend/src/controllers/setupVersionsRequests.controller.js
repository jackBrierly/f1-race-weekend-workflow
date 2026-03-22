const {
    parsePositiveIntId,
    requireNonEmptyObject,
    requireNonEmptyString,
} = require('../utils/request-validators')
const { withErrorHandling } = require('../utils/controller-error-handler')
const setupVersionsRequestsService = require('../services/setupVersionsRequests.service')

exports.listSetupVersionsRequestsForWeekend = (req, res) => {
    let { teamId, weekendId } = req.params

    return withErrorHandling(res, () => {
        teamId = parsePositiveIntId(teamId, 'team')
        weekendId = parsePositiveIntId(weekendId, 'weekend')

        const setupVersionsForWeekend = setupVersionsRequestsService.listSetupVersionsRequestsForWeekend(teamId, weekendId)
        return res.status(200).json(setupVersionsForWeekend)
    })
}

exports.getSetupVersionRequest = (req, res) => {
    let { teamId, weekendId, setupVersionRequestId } = req.params

    return withErrorHandling(res, () => {
        teamId = parsePositiveIntId(teamId, 'team')
        weekendId = parsePositiveIntId(weekendId, 'weekend')
        setupVersionRequestId = parsePositiveIntId(setupVersionRequestId, 'setupVersionRequest')

        const request = setupVersionsRequestsService.getSetupVersionRequest(teamId, weekendId, setupVersionRequestId)
        return res.status(200).json(request)
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
