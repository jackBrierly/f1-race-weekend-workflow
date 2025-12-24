/**
 * This file defines the Weekend "model"
 * The model defines what the data can look like and how it is allowed to change
 * Controllers decide when those values can change and make the change happen
 */

const { WORKFLOW_STAGES_ORDER, WORKFLOW_STAGES } = require('../constants/workflow-stages')
const { 
  QUALIFYING_SEGMENTS_ORDER, 
  QUALIFYING_SEGMENTS,
  PRACTICE_SEGMENTS_ORDER,
  PRACTICE_SEGMENTS,
} = require('../constants/segments')

let id = 0

// Check if a stage is a valid workflow stage
// This helps avoid magic strings spread throughout the codebase
function isValidStage(stage) {
  return WORKFLOW_STAGES_ORDER.includes(stage)
}

// Check if a transition is allowed eg Practice -> Qualifying is true, Qualifying -> Review is false
// This does not belong in the controller as it doesn't change the data;
// The actual transition still belongs in the controller
function canTransition(fromStage, toStage, fromSegment) {
  const fromIndex = WORKFLOW_STAGES_ORDER.indexOf(fromStage)
  const toIndex = WORKFLOW_STAGES_ORDER.indexOf(toStage)

  if (fromStage === WORKFLOW_STAGES.QUALIFYING && toStage === WORKFLOW_STAGES.RACE) {
    return fromSegment === QUALIFYING_SEGMENTS.Q3
  } else if (fromStage === WORKFLOW_STAGES.PRACTICE && toStage === WORKFLOW_STAGES.QUALIFYING) {
    return fromSegment === PRACTICE_SEGMENTS.P3
  } 

  return toIndex === fromIndex + 1 
        || fromStage === WORKFLOW_STAGES.QUALIFYING && toStage === WORKFLOW_STAGES.QUALIFYING
        || fromStage === WORKFLOW_STAGES.PRACTICE && toStage === WORKFLOW_STAGES.PRACTICE
}

// Check if a segment is a valid workflow stage
// This helps avoid magic strings spread throughout the codebase
function isValidSegment(segment) {
  return segment === undefined || QUALIFYING_SEGMENTS_ORDER.includes(segment) || PRACTICE_SEGMENTS_ORDER.includes(segment)
}

function canTransitionSegment(fromSegment, toSegment, toStage) {
  // ensure there does not exist a segment for race or review
  if (toStage === WORKFLOW_STAGES.RACE || toStage === WORKFLOW_STAGES.REVIEW) {
    return toSegment === undefined
  }

  if (toSegment === undefined) {
    toSegment = fromSegment
  }

  // if from P3 to qualifying NULL
  if (fromSegment === PRACTICE_SEGMENTS.P3 && toSegment === PRACTICE_SEGMENTS.NULL) {
    return true
  }

  let segments_order
  if (toStage === WORKFLOW_STAGES.QUALIFYING) {
    segments_order = QUALIFYING_SEGMENTS_ORDER
  } else if (toStage === WORKFLOW_STAGES.PRACTICE) {
    segments_order = PRACTICE_SEGMENTS_ORDER
  } else {
    return false
  }

  const fromIndex = segments_order.indexOf(fromSegment)
  const toIndex = segments_order.indexOf(toSegment)

  return toIndex === fromIndex + 1
}

/**
 * Create a new Weekend object with validated fields and defaults
 * This function centralises the rules for what a Weekend is
 *
 * IMPORTANT
 * - This does NOT save the weekend anywhere
 * - This does NOT handle HTTP requests or responses
 * - It only constructs a valid Weekend object
 *
 * @param {Object} params
 * @param {number} params.id - Unique weekend identifier
 * @param {number} params.teamId - ID of the owning team
 * @param {string} params.name - Human-readable weekend name
 * @returns {Object} Weekend
 */
function initialiseWeekend({ teamId, name }) {
  // Ensure the name is a trimmed string to avoid whitespace-only values
  const trimmedName = typeof name === 'string' ? name.trim() : ''

  if (!Number.isInteger(teamId) || teamId <= 0) {
    throw new Error('Invalid teamId')
  }

  if (!trimmedName) {
    throw new Error('Weekend name is required')
  }

  // Use ISO timestamps so values are consistent and DB-friendly
  const now = new Date().toISOString()

  id += 1

  // Return a plain object representing the Weekend
  // This is intentionally NOT a class
  return {
    id,
    teamId,
    name: trimmedName,

    // Workflow state
    // All weekends always start in Practice
    stage: WORKFLOW_STAGES.PRACTICE,

    // Optional sub-stage (eg Q1/Q2/Q3 or P1/P2/P3), null when not applicable
    segment: null,

    // Timestamps for auditability and future ordering
    createdAt: now,
    updatedAt: now,
  }
}

// Export helpers so controllers can
// - validate stages
// - construct weekends safely
module.exports = {
  isValidStage,
  canTransition,
  initialiseWeekend,
  isValidSegment,
  canTransitionSegment
}
