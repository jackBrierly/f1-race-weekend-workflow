const {
    parsePositiveIntId,
} = require('../utils/request-validators')
const { withErrorHandling } = require('../utils/controller-error-handler')
const { throwAppError } = require('../utils/app-error')
const weekendsService = require('../services/weekends.service')

function createWeekend(req, res) {
    let { teamId } = req.params
    let { name } = req.body || {}

    return withErrorHandling(res, () => {
        teamId = parsePositiveIntId(teamId, 'Team')
        if (typeof name !== 'string' || name.trim().length === 0) {
            throwAppError('Weekend name is required', 'INVALID_STRING')
        }
        name = name.trim()

        const weekend = weekendsService.createWeekend(teamId, name)
        return res.status(201).json(weekend)
    })
}

function listWeekends(req, res) {
    let { teamId } = req.params

    return withErrorHandling(res, () => {
        teamId = parsePositiveIntId(teamId, 'Team')
        const weekends = weekendsService.listWeekends(teamId)
        return res.status(200).json(weekends)
    })
}

function getWeekend(req, res) {
    let { teamId, weekendId } = req.params

    return withErrorHandling(res, () => {
        teamId = parsePositiveIntId(teamId, 'Team')
        weekendId = parsePositiveIntId(weekendId, 'Weekend')

        const weekend = weekendsService.getWeekend(teamId, weekendId)
        return res.status(200).json(weekend)
    })
}

function transitionWeekendStage(req, res) {
    let { teamId, weekendId } = req.params
    let { toStage, toSegment, actorRole, actorName } = req.body || {}

    return withErrorHandling(res, () => {
        teamId = parsePositiveIntId(teamId, 'Team')
        weekendId = parsePositiveIntId(weekendId, 'Weekend')

        if (typeof actorRole !== 'string' || actorRole.trim().length === 0) {
            throwAppError('actorRole is required', 'INVALID_STRING')
        }

        if (typeof actorName !== 'string' || actorName.trim().length === 0) {
            throwAppError('actorName is required', 'INVALID_STRING')
        }

        actorRole = actorRole.trim()
        actorName = actorName.trim()

        const weekend = weekendsService.transitionWeekendStage(
            teamId,
            weekendId,
            toStage,
            toSegment,
            actorName,
            actorRole
        )

        return res.status(201).json(weekend)
    })
}

module.exports = {
    createWeekend,
    listWeekends,
    getWeekend,
    transitionWeekendStage,
}
