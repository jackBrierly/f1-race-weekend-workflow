const WORKFLOW_STAGES = {
  PRACTICE: 'Practice',
  QUALIFYING: 'Qualifying',
  RACE: 'Race',
  REVIEW: 'Review',
}

// Ordered list — the index represents progression.
const WORKFLOW_STAGES_ORDER = [
  WORKFLOW_STAGES.PRACTICE,
  WORKFLOW_STAGES.QUALIFYING,
  WORKFLOW_STAGES.RACE,
  WORKFLOW_STAGES.REVIEW,
]

module.exports = { WORKFLOW_STAGES, WORKFLOW_STAGES_ORDER }