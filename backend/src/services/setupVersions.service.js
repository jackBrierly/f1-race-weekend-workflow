const setupVersionsRequestsModel = require('../models/setupVersionsRequests.model')
const setupVersionsModel = require('../models/setupVersions.model')
const { getStage } = require('../data/weekends.data')
const { WORKFLOW_STAGES } = require('../constants/workflow-stages')
const { ROLES } = require('../constants/roles')
const { teamExistsById } = require('../data/teams.data')
const { weekendExistsForTeam } = require('../data/weekends.data')

exports.createSetupVersion = (teamId, weekendId, parameters, createdBy, createdByRole, setupVersionRequestId) => {

    /**
     * Business rules:
     * - teamId must exist
     * - weekendId must exist for this team
     * - if there is no requestId:
     *      must be during practice
     * - if there is a requestId:
     *      request must exist for weekend
     *      must be during qualifying or race
     *      requests status must be 'ACCEPTED'
     * - createdByRole must be ENGINEER
    */

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

    const stage = getStage(weekendId)

    if (setupVersionRequestId !== null) {
        if (!setupVersionsRequestsModel.setupVersionRequestExistsForWeekend(setupVersionRequestId, weekendId)) {
            const err = new Error('Setup Version Request not found for this teams weekend')
            err.code = 'SETUP_VERSION_REQUEST_NOT_FOUND'
            throw err
        }
        const request = setupVersionsRequestsModel.getRequest(setupVersionRequestId)
        if (request.status !== 'ACCEPTED') {
            const err = new Error('request status must be ACCEPTED')
            err.code = 'INVALID_REQUEST_STATUS'
            throw err
        }

        if (stage !== WORKFLOW_STAGES.QUALIFYING && stage !== WORKFLOW_STAGES.RACE) {
            const err = new Error('Weekend must be in QUALIFYING or RACE for a requested setup version')
            err.code = 'INVALID_STAGE'
            throw err
        }
    } else if (stage !== WORKFLOW_STAGES.PRACTICE) {
        const err = new Error('Weekend must be in PRACTICE for an unrequested setup version')
        err.code = 'INVALID_STAGE'
        throw err
    }

    if (createdByRole !== ROLES.ENGINEER) {
        const err = new Error('createdByRole must be ENGINEER')
        err.code = 'INVALID_ROLE'
        throw err
    }

    return setupVersionsModel.createSetupVersion(teamId, weekendId, parameters, createdBy, createdByRole, setupVersionRequestId)
}