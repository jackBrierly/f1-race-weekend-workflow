const { ROLES } = require('../constants/roles')
const { AUDIT_TYPES } = require('../constants/audit-types')
const teamsModel = require('../models/teams.model')
const weekendsModel = require('../models/weekends.model')
const { logAuditTransition, getNextAuditId } = require('../data/audit.data')
const { throwAppError } = require('../utils/app-error')

function assertTeamExists(teamId) {
  if (!teamsModel.teamExistsById(teamId)) {
    throwAppError('Team not found', 'TEAM_NOT_FOUND')
  }
}

function assertWeekendExistsForTeam(teamId, weekendId) {
  if (!weekendsModel.weekendExistsForTeam(weekendId, teamId)) {
    throwAppError('Weekend not found', 'WEEKEND_NOT_FOUND')
  }
}

function createWeekend(teamId, name) {
  assertTeamExists(teamId)

  if (weekendsModel.weekendNameExistsForTeam(teamId, name)) {
    throwAppError('This weekend already exists', 'DUPLICATE')
  }

  return weekendsModel.createWeekend(teamId, name)
}

function listWeekends(teamId) {
  assertTeamExists(teamId)
  return weekendsModel.listWeekendsByTeam(teamId)
}

function getWeekend(teamId, weekendId) {
  assertTeamExists(teamId)
  assertWeekendExistsForTeam(teamId, weekendId)
  return weekendsModel.findWeekendByTeamAndId(teamId, weekendId)
}

function transitionWeekendStage(teamId, weekendId, toStage, toSegment, actorName, actorRole) {
  if (actorRole !== ROLES.LEAD_ENGINEER) {
    throwAppError('Only the Lead Engineer can transition stages', 'FORBIDDEN')
  }

  if (!teamsModel.teamExistsById(teamId)) {
    throwAppError('Team not found', 'TRANSITION_TEAM_NOT_FOUND')
  }

  assertWeekendExistsForTeam(teamId, weekendId)

  if (!weekendsModel.isValidStage(toStage)) {
    throwAppError('Invalid stage name', 'INVALID_STAGE_NAME')
  }

  if (!weekendsModel.isValidSegment(toSegment)) {
    throwAppError('Invalid segment', 'INVALID_SEGMENT')
  }

  const weekend = weekendsModel.findWeekendByTeamAndId(teamId, weekendId)
  const fromStage = weekend.stage
  const fromSegment = weekend.segment

  if (!weekendsModel.canTransition(fromStage, toStage, fromSegment)) {
    throwAppError('Workflow transition is not allowed from the current stage', 'INVALID_TRANSITION')
  }

  if (!weekendsModel.canTransitionSegment(fromSegment, toSegment, toStage)) {
    throwAppError('Segment transition is not allowed from the current stage', 'INVALID_TRANSITION')
  }

  const updatedWeekend = weekendsModel.transitionWeekendStage(weekendId, toStage, toSegment)

  logAuditTransition({
    type: AUDIT_TYPES.WEEKEND_STAGE_TRANSITION,
    id: getNextAuditId(),
    teamId: updatedWeekend.teamId,
    weekendId: updatedWeekend.id,
    actorName,
    actorRole,
    fromStage,
    toStage,
    fromSegment,
    toSegment,
    createdAt: updatedWeekend.updatedAt,
  })

  return updatedWeekend
}

module.exports = {
  createWeekend,
  listWeekends,
  getWeekend,
  transitionWeekendStage,
}
