/**
 * This file defines the Weekend "model"
 * The model defines what the data can look like and how it is allowed to change
 * Controllers decide when those values can change and make the change happen
 */

const { WORKFLOW_STAGES_ORDER, WORKFLOW_STAGES } = require('../constants/workflow-stages')
const { SEGMENTS_ORDER, SEGMENTS } = require('../constants/segments')

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
      return fromSegment === SEGMENTS.Q3
    }

    return toIndex === fromIndex+1
}

// Check if a stage is a valid workflow stage
// This helps avoid magic strings spread throughout the codebase
function isValidSegment(segment) {
  return segment === undefined || SEGMENTS_ORDER.includes(segment)
}

function canTransitionSegment(fromSegment, toSegment, stage) {  
  if (stage !== WORKFLOW_STAGES.QUALIFYING) {
    return false
  }

  const fromIndex = SEGMENTS_ORDER.indexOf(fromSegment)
  const toIndex = SEGMENTS_ORDER.indexOf(toSegment)

  return toIndex === fromIndex+1
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

  id+=1

  // Return a plain object representing the Weekend
  // This is intentionally NOT a class
  return {
    id,
    teamId,
    name: trimmedName,

    // Workflow state
    // All weekends always start in Practice
    stage: WORKFLOW_STAGES.PRACTICE,   

    // Optional sub-stage (eg Q1/Q2/Q3) null when not applicable
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
