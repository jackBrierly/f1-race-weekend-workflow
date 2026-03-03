const setupVersionsRequestsModel = require('../models/setupVersionsRequests.model')

const { teamExistsById } = require('../data/teams.data')
const { weekendExistsForTeam, getStage } = require('../data/weekends.data')
const { ROLES } = require('../constants/roles')
const { WORKFLOW_STAGES } = require('../constants/workflow-stages')

function throwErr(message, code) {
  const err = new Error(message)
  err.code = code
  throw err
}

function assertTeamWeekendExists(teamId, weekendId) {
  if (!teamExistsById(teamId)) throwErr('Team not found', 'TEAM_NOT_FOUND')
  if (!weekendExistsForTeam(weekendId, teamId)) throwErr('Weekend not found for this team', 'WEEKEND_NOT_FOUND')
}

function assertParcFermeStage(weekendId) {
  const stage = getStage(weekendId)
  if (stage !== WORKFLOW_STAGES.QUALIFYING && stage !== WORKFLOW_STAGES.RACE) {
    throwErr('Weekend must be in QUALIFYING or RACE', 'INVALID_STAGE')
  }
}

function getPendingRequestOrThrow(setupVersionRequestId, weekendId) {
  const exists = setupVersionsRequestsModel.setupVersionRequestExistsForWeekend(setupVersionRequestId, weekendId)
  if (!exists) throwErr('Setup Version Request not found for this teams weekend', 'SETUP_VERSION_REQUEST_NOT_FOUND')

  const request = setupVersionsRequestsModel.getRequest(setupVersionRequestId)
  if (!request) throwErr('Setup Version Request not found', 'SETUP_VERSION_REQUEST_NOT_FOUND')

  if (request.status !== 'PENDING') throwErr('request status must be PENDING', 'INVALID_REQUEST_STATUS')

  return request
}

exports.acceptSetupVersionRequest = (teamId, weekendId, setupVersionRequestId, acceptedBy, acceptedByRole) => {
  assertTeamWeekendExists(teamId, weekendId)
  assertParcFermeStage(weekendId)

  if (acceptedByRole !== ROLES.LEAD_ENGINEER) throwErr('acceptedByRole must be LEAD_ENGINEER', 'INVALID_ROLE')

  const request = getPendingRequestOrThrow(setupVersionRequestId, weekendId)

  if (acceptedBy !== request.requestedTo) throwErr('acceptedBy must be equal to requestedTo', 'INVALID_USER')

  return setupVersionsRequestsModel.acceptSetupVersionRequest(setupVersionRequestId)
}

exports.declineSetupVersionRequest = (teamId, weekendId, setupVersionRequestId, declinedBy, declinedByRole) => {
  assertTeamWeekendExists(teamId, weekendId)

  if (declinedByRole !== ROLES.LEAD_ENGINEER) throwErr('declinedByRole must be LEAD_ENGINEER', 'INVALID_ROLE')

  const request = getPendingRequestOrThrow(setupVersionRequestId, weekendId)

  if (declinedBy !== request.requestedTo) throwErr('declinedBy must be equal to requestedTo', 'INVALID_USER')

  return setupVersionsRequestsModel.declineSetupVersionRequest(setupVersionRequestId)
}

exports.listSetupVersionsRequestsForWeekend = (teamId, weekendId) => {
  assertTeamWeekendExists(teamId, weekendId)
  return setupVersionsRequestsModel.listSetupVersionsRequestsForWeekend(weekendId)
}

exports.createSetupVersionRequest = (teamId, weekendId, requestedBy, requestedByRole, requestedTo, requestedToRole, parameters) => {
  assertTeamWeekendExists(teamId, weekendId)
  assertParcFermeStage(weekendId)

  if (requestedByRole !== ROLES.ENGINEER) throwErr('requestedByRole must be ENGINEER', 'INVALID_ROLE')
  if (requestedToRole !== ROLES.LEAD_ENGINEER) throwErr('requestedToRole must be LEAD_ENGINEER', 'INVALID_ROLE')

  return setupVersionsRequestsModel.createSetupVersionRequest(
    teamId, weekendId, requestedBy, requestedByRole, requestedTo, requestedToRole, parameters
  )
}