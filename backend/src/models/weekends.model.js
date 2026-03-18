const { WORKFLOW_STAGES_ORDER, WORKFLOW_STAGES } = require('../constants/workflow-stages')
const {
  QUALIFYING_SEGMENTS_ORDER,
  QUALIFYING_SEGMENTS,
  PRACTICE_SEGMENTS_ORDER,
  PRACTICE_SEGMENTS,
} = require('../constants/segments')

let nextWeekendId = 1
const weekends = []

function getNextWeekendId() {
  return nextWeekendId++
}

function getWeekend(weekendId) {
  const weekend = weekends.find((value) => value.id === weekendId)

  if (!weekend) {
    const err = new Error('Weekend not found')
    err.code = 'WEEKEND_NOT_FOUND'
    throw err
  }

  return weekend
}

function isValidStage(stage) {
  return WORKFLOW_STAGES_ORDER.includes(stage)
}

function canTransition(fromStage, toStage, fromSegment) {
  const fromIndex = WORKFLOW_STAGES_ORDER.indexOf(fromStage)
  const toIndex = WORKFLOW_STAGES_ORDER.indexOf(toStage)

  if (fromStage === WORKFLOW_STAGES.QUALIFYING && toStage === WORKFLOW_STAGES.RACE) {
    return fromSegment === QUALIFYING_SEGMENTS.Q3
  }

  if (fromStage === WORKFLOW_STAGES.PRACTICE && toStage === WORKFLOW_STAGES.QUALIFYING) {
    return fromSegment === PRACTICE_SEGMENTS.P3
  }

  return toIndex === fromIndex + 1
    || fromStage === WORKFLOW_STAGES.QUALIFYING && toStage === WORKFLOW_STAGES.QUALIFYING
    || fromStage === WORKFLOW_STAGES.PRACTICE && toStage === WORKFLOW_STAGES.PRACTICE
}

function isValidSegment(segment) {
  return QUALIFYING_SEGMENTS_ORDER.includes(segment) || PRACTICE_SEGMENTS_ORDER.includes(segment)
}

function canTransitionSegment(fromSegment, toSegment, toStage) {
  if (toStage === WORKFLOW_STAGES.RACE || toStage === WORKFLOW_STAGES.REVIEW) {
    return toSegment === null
  }

  if (fromSegment === PRACTICE_SEGMENTS.P3 && toSegment === PRACTICE_SEGMENTS.NULL) {
    return true
  }

  let segmentsOrder
  if (toStage === WORKFLOW_STAGES.QUALIFYING) {
    segmentsOrder = QUALIFYING_SEGMENTS_ORDER
  } else if (toStage === WORKFLOW_STAGES.PRACTICE) {
    segmentsOrder = PRACTICE_SEGMENTS_ORDER
  } else {
    return false
  }

  const fromIndex = segmentsOrder.indexOf(fromSegment)
  const toIndex = segmentsOrder.indexOf(toSegment)

  return toIndex === fromIndex + 1
}

function createWeekend(teamId, name) {
  const now = new Date().toISOString()
  const weekend = {
    id: getNextWeekendId(),
    teamId,
    name,
    currentSetupVersionNumber: 0,
    stage: WORKFLOW_STAGES.PRACTICE,
    segment: null,
    createdAt: now,
    updatedAt: now,
  }

  weekends.push(weekend)
  return weekend
}

function findWeekendByTeamAndId(teamId, weekendId) {
  return weekends.find((weekend) => weekend.teamId === teamId && weekend.id === weekendId) || null
}

function listWeekendsByTeam(teamId) {
  return weekends.filter((weekend) => weekend.teamId === teamId)
}

function weekendNameExistsForTeam(teamId, name) {
  return weekends.some((weekend) => weekend.teamId === teamId && weekend.name === name)
}

function weekendExistsForTeam(weekendId, teamId) {
  return weekends.some((weekend) => weekend.id === weekendId && weekend.teamId === teamId)
}

function getNextVersionNumber(weekendId) {
  const weekend = getWeekend(weekendId)
  weekend.currentSetupVersionNumber += 1
  return weekend.currentSetupVersionNumber
}

function getStage(weekendId) {
  return getWeekend(weekendId).stage
}

function getSegment(weekendId) {
  return getWeekend(weekendId).segment
}

function transitionWeekendStage(weekendId, toStage, toSegment) {
  const weekend = getWeekend(weekendId)
  weekend.stage = toStage

  if (toSegment !== undefined) {
    weekend.segment = toSegment
  }

  weekend.updatedAt = new Date().toISOString()
  return weekend
}

function resetWeekends() {
  weekends.length = 0
  nextWeekendId = 1
}

module.exports = {
  createWeekend,
  findWeekendByTeamAndId,
  listWeekendsByTeam,
  weekendNameExistsForTeam,
  weekendExistsForTeam,
  getNextVersionNumber,
  getStage,
  getSegment,
  transitionWeekendStage,
  resetWeekends,
  isValidStage,
  canTransition,
  isValidSegment,
  canTransitionSegment,
}
