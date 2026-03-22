const {
    getNextVersionNumber,
    getStage,
    getSegment,
} = require('./weekends.model')

const { ROLES } = require('../constants/roles')
const { WORKFLOW_STAGES } = require('../constants/workflow-stages')
const { STATES } = require('../constants/states')

let nextSetupVersionId = 1
const setupVersions = []

function getNextSetupVersionId() {
    return nextSetupVersionId++
}

function createSetupVersion(teamId, weekendId, parameters, createdBy, createdByRole, setupVersionRequestId) {
    const setupVersion = {
        id: getNextSetupVersionId(),
        teamId,
        weekendId,
        setupVersionRequestId,
        versionNumber: getNextVersionNumber(weekendId),
        segment: getSegment(weekendId),
        parameters,
        createdBy,
        createdByRole,
        createdAtStage: getStage(weekendId),
        createdAt: new Date().toISOString(),
    }

    setupVersions.push(setupVersion)

    return setupVersion
}

function listSetupVersionsForWeekend(weekendId) {
    return setupVersions.filter((setupVersion) => setupVersion.weekendId === weekendId)
}

function findSetupVersionByTeamWeekendAndId(teamId, weekendId, setupVersionId) {
    return setupVersions.find((setupVersion) =>
        setupVersion.teamId === teamId
        && setupVersion.weekendId === weekendId
        && setupVersion.id === setupVersionId
    ) || null
}

function resetSetupVersions() {
    setupVersions.length = 0
    nextSetupVersionId = 1
}

function canCreateSetup(stage) {
    return (stage === WORKFLOW_STAGES.PRACTICE || stage === WORKFLOW_STAGES.QUALIFYING)
}


/**
 * Create a new setupVersion object with validated fields and defaults
 * This function centralises the rules for what a setupVersion
 */
function initialiseSetupVersion({ teamId, weekendId, changeRequestId = null, parameters, createdBy, createdByRole }) {



    if (typeof createdBy !== 'string' || createdBy.trim().length === 0) {
        throw new Error('createdBy is required')
    }

    if (!createdByRole) {
        throw new Error('createdByRole is required')
    }

    if (!Number.isInteger(teamId) || teamId <= 0) {
        throw new Error('Invalid teamId')
    }

    if (!Number.isInteger(weekendId) || weekendId <= 0) {
        throw new Error('Invalid weekendId')
    }

    if (changeRequestId !== null && (!Number.isInteger(changeRequestId) || changeRequestId <= 0)) {
        throw new Error('Invalid changeRequestId')
    }

    if (createdByRole !== ROLES.ENGINEER && createdByRole !== ROLES.LEAD_ENGINEER) {
        throw new Error('Invalid createdByRole')
    }

    // Arrays.isArray is to reject arrays — arrays count as objects in JavaScript but we only allow plain key-value objects
    if (parameters === null || typeof parameters !== 'object' || Array.isArray(parameters)) {
        throw new Error('parameters must be an object')
    }

    const stage = getStage(weekendId)

    let state
    switch (stage) {
        case WORKFLOW_STAGES.PRACTICE:
            state = STATES.MUTABLE
            break

        case WORKFLOW_STAGES.QUALIFYING:
            state = STATES.FINALISED
            break

        case WORKFLOW_STAGES.RACE:
            state = STATES.LOCKED
            break

        case WORKFLOW_STAGES.REVIEW:
            throw new Error('Cannot create setups during review')

        default:
            throw new Error(`Unknown stage: ${stage}`)
    }

    // Use ISO timestamps so values are consistent and DB-friendly
    const createdAt = new Date().toISOString()

    // Return a plain object representing the Weekend
    // This is intentionally NOT a class
    return {
        id: getNextSetupVersionId(),
        teamId,
        weekendId,
        changeRequestId,
        versionNumber: getNextVersionNumber(weekendId),
        stage,
        segment: getSegment(weekendId),
        state,
        parameters,
        createdBy,
        createdByRole,
        createdAt,
    }
}

module.exports = {
    initialiseSetupVersion,
    canCreateSetup,
    createSetupVersion,
    findSetupVersionByTeamWeekendAndId,
    listSetupVersionsForWeekend,
    resetSetupVersions,
}
