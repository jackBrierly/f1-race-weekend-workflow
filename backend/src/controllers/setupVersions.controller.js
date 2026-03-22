const {
    parsePositiveIntId,
    requireNonEmptyObject,
    requireNonEmptyString,
} = require('../utils/request-validators')
const { withErrorHandling } = require('../utils/controller-error-handler')
const setupVersionsService = require('../services/setupVersions.service')

function createSetupVersion(req, res) {
    let { teamId, weekendId } = req.params
    let {
        parameters,
        createdBy,
        createdByRole,
        setupVersionRequestId,
    } = req.body || {}

    return withErrorHandling(res, () => {
        teamId = parsePositiveIntId(teamId, 'team')
        weekendId = parsePositiveIntId(weekendId, 'weekend')

        if (setupVersionRequestId !== null) {
            setupVersionRequestId = parsePositiveIntId(setupVersionRequestId, 'setupVersionRequest')
        }

        createdBy = requireNonEmptyString(createdBy, 'createdBy')
        createdByRole = requireNonEmptyString(createdByRole, 'createdByRole')
        parameters = requireNonEmptyObject(parameters, 'parameters')

        const setupVersion = setupVersionsService.createSetupVersion(
            teamId,
            weekendId,
            parameters,
            createdBy,
            createdByRole,
            setupVersionRequestId
        )

        return res.status(201).json(setupVersion)
    })
}

function listSetupVersionsForWeekend(req, res) {
    let { teamId, weekendId } = req.params

    return withErrorHandling(res, () => {
        teamId = parsePositiveIntId(teamId, 'team')
        weekendId = parsePositiveIntId(weekendId, 'weekend')

        const setupVersions = setupVersionsService.listSetupVersionsForWeekend(teamId, weekendId)
        return res.status(200).json(setupVersions)
    })
}

function getSetupVersion(req, res) {
    let { teamId, weekendId, setupVersionId } = req.params

    return withErrorHandling(res, () => {
        teamId = parsePositiveIntId(teamId, 'team')
        weekendId = parsePositiveIntId(weekendId, 'weekend')
        setupVersionId = parsePositiveIntId(setupVersionId, 'setupVersion')

        const setupVersion = setupVersionsService.getSetupVersion(teamId, weekendId, setupVersionId)
        return res.status(200).json(setupVersion)
    })
}

module.exports = {
    createSetupVersion,
    getSetupVersion,
    listSetupVersionsForWeekend,
}
