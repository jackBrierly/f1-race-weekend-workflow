const setupVersionsRequestsModel = require('../models/setupVersionsRequests.model')

const { teamExistsById } = require('../data/teams.data')
const { weekendExistsForTeam, getStage } = require('../data/weekends.data')
const { ROLES } = require('../constants/roles')
const { WORKFLOW_STAGES } = require('../constants/workflow-stages')


exports.createSetupVersionRequest = (teamId, weekendId, requestedBy, requestedByRole, requestedTo, requestedToRole, parameters) => {
    /**
     * Business rules:
     * - teamId must exist
     * - weekendId must exist for this team
     * - requestedByRole must be ENGINEER
     * - requestedToRole must be LEAD_ENGINEER
     * - weekend stage must be QUALIFYING or RACE
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

    // requestedByRole must be ENGINEER
    if (requestedByRole !== ROLES.ENGINEER) {
        const err = new Error('requestedByRole must be ENGINEER')
        err.code = 'INVALID_ROLE'
        throw err
    }

    // requestedToRole must be LEAD_ENGINEER
    if (requestedToRole !== ROLES.LEAD_ENGINEER) {
        const err = new Error('requestedToRole must be LEAD_ENGINEER')
        err.code = 'INVALID_ROLE'
        throw err
    }

    // stage must be QUALIFYING or RACE
    const stage = getStage(weekendId)

    if (stage !== WORKFLOW_STAGES.QUALIFYING && stage !== WORKFLOW_STAGES.RACE) {
        const err = new Error('Weekend must be in QUALIFYING or RACE')
        err.code = 'INVALID_STAGE'
        throw err
    }

    return setupVersionsRequestsModel.createSetupVersionRequest(teamId, weekendId, requestedBy, requestedByRole, requestedTo, requestedToRole, parameters)

    // send request to lead engineer (optional)
}
