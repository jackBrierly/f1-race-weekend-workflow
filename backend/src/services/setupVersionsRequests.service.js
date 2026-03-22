const setupVersionsRequestsModel = require('../models/setupVersionsRequests.model')
const teamsModel = require('../models/teams.model')
const weekendsModel = require('../models/weekends.model')
const { ROLES } = require('../constants/roles')
const { WORKFLOW_STAGES } = require('../constants/workflow-stages')
const { throwAppError } = require('../utils/app-error')

function assertTeamWeekendExists(teamId, weekendId) {
  if (!teamsModel.teamExistsById(teamId)) throwAppError('Team not found', 'TEAM_NOT_FOUND')
  if (!weekendsModel.weekendExistsForTeam(weekendId, teamId)) throwAppError('Weekend not found for this team', 'WEEKEND_NOT_FOUND')
}

function assertParcFermeStage(weekendId) {
  const stage = weekendsModel.getStage(weekendId)
  if (stage !== WORKFLOW_STAGES.QUALIFYING && stage !== WORKFLOW_STAGES.RACE) {
    throwAppError('Weekend must be in QUALIFYING or RACE', 'INVALID_STAGE')
  }
}

function getPendingRequestOrThrow(setupVersionRequestId, weekendId) {
  const exists = setupVersionsRequestsModel.setupVersionRequestExistsForWeekend(setupVersionRequestId, weekendId)
  if (!exists) throwAppError('Setup Version Request not found for this teams weekend', 'SETUP_VERSION_REQUEST_NOT_FOUND')

  const request = setupVersionsRequestsModel.getRequest(setupVersionRequestId)
  if (!request) throwAppError('Setup Version Request not found', 'SETUP_VERSION_REQUEST_NOT_FOUND')

  if (request.status !== 'PENDING') throwAppError('request status must be PENDING', 'INVALID_REQUEST_STATUS')

  return request
}

exports.acceptSetupVersionRequest = (teamId, weekendId, setupVersionRequestId, acceptedBy, acceptedByRole) => {
  assertTeamWeekendExists(teamId, weekendId)
  assertParcFermeStage(weekendId)

  if (acceptedByRole !== ROLES.LEAD_ENGINEER) throwAppError('acceptedByRole must be LEAD_ENGINEER', 'INVALID_ROLE')

  const request = getPendingRequestOrThrow(setupVersionRequestId, weekendId)

  if (acceptedBy !== request.requestedTo) throwAppError('acceptedBy must be equal to requestedTo', 'INVALID_USER')

  return setupVersionsRequestsModel.acceptSetupVersionRequest(setupVersionRequestId)
}

exports.declineSetupVersionRequest = (teamId, weekendId, setupVersionRequestId, declinedBy, declinedByRole) => {
  assertTeamWeekendExists(teamId, weekendId)

  if (declinedByRole !== ROLES.LEAD_ENGINEER) throwAppError('declinedByRole must be LEAD_ENGINEER', 'INVALID_ROLE')

  const request = getPendingRequestOrThrow(setupVersionRequestId, weekendId)

  if (declinedBy !== request.requestedTo) throwAppError('declinedBy must be equal to requestedTo', 'INVALID_USER')

  return setupVersionsRequestsModel.declineSetupVersionRequest(setupVersionRequestId)
}

exports.listSetupVersionsRequestsForWeekend = (teamId, weekendId) => {
  assertTeamWeekendExists(teamId, weekendId)
  return setupVersionsRequestsModel.listSetupVersionsRequestsForWeekend(weekendId)
}

exports.getSetupVersionRequest = (teamId, weekendId, setupVersionRequestId) => {
  assertTeamWeekendExists(teamId, weekendId)

  const exists = setupVersionsRequestsModel.setupVersionRequestExistsForWeekend(setupVersionRequestId, weekendId)
  if (!exists) throwAppError('Setup Version Request not found for this teams weekend', 'SETUP_VERSION_REQUEST_NOT_FOUND')

  const request = setupVersionsRequestsModel.getRequest(setupVersionRequestId)
  if (!request) throwAppError('Setup Version Request not found', 'SETUP_VERSION_REQUEST_NOT_FOUND')

  return request
}

exports.createSetupVersionRequest = (teamId, weekendId, requestedBy, requestedByRole, requestedTo, requestedToRole, parameters) => {
  assertTeamWeekendExists(teamId, weekendId)
  assertParcFermeStage(weekendId)

  if (requestedByRole !== ROLES.ENGINEER) throwAppError('requestedByRole must be ENGINEER', 'INVALID_ROLE')
  if (requestedToRole !== ROLES.LEAD_ENGINEER) throwAppError('requestedToRole must be LEAD_ENGINEER', 'INVALID_ROLE')

  return setupVersionsRequestsModel.createSetupVersionRequest(
    teamId, weekendId, requestedBy, requestedByRole, requestedTo, requestedToRole, parameters
  )
}
