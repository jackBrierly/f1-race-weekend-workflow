const { ERROR_CODES } = require('../constants/error-codes')
const { SEGMENTS } = require('../constants/segments')
const {
    canTransition,
    initialiseWeekend,
    isValidSegment,
    isValidStage,
    canTransitionSegment,
} = require('../models/weekends.model')

// In memory storage
const weekends = []
const { teams } = require('../data/teams.data')

// Check if a name is missing or empty after trimming
function isInvalidName(name) {
    return (!name || typeof name !== 'string' || name.trim().length === 0)
}

// Standard error response for invalid input
function invalidInputErrorMessage(res, message) {
    return res.status(400).json({ 'error': { 'code': ERROR_CODES.BAD_REQUEST, 'message': message } })
}

// Get and validate Teams ID from the URL
function getTeamIdOr400(req, res) {
    // Read the teamId from the URL params (eg /teams/1/weekends)
    const teamId = Number.parseInt(req.params.teamId, 10)
    // If teamId is missing, not a number, or <= 0, return a 400 error
    if (!Number.isInteger(teamId) || teamId <= 0) {
        invalidInputErrorMessage(res, 'Team id must be a positive integer')
        // Return null so the caller can stop
        return null
    }
    return teamId
}
// Get and validate Weekends ID from the URL
function getWeekendIdOr400(req, res) {
    // Read the weekendId from the URL params (eg /teams/1/weekends/2)
    const weekendId = Number.parseInt(req.params.weekendId, 10)
    // If weekendId is missing, not a number, or <= 0, return a 400 error
    if (!Number.isInteger(weekendId) || weekendId <= 0) {
        invalidInputErrorMessage(res, 'Weekend id must be a positive integer')
        // Return null so the caller can stop
        return null
    }
    return weekendId
}
// Find a weekend by teamId and weekendId or return a 404
function getWeekendOr404(res, teamId, weekendId) {
    const weekend = weekends.find(
        (w) => w.teamId === teamId && w.id === weekendId
    )
    if (!weekend) {
        res.status(404).json({ 'error': { 'code': ERROR_CODES.NOT_FOUND, 'message': 'Weekend not found' } })
        return null
    }
    return weekend
}

/**
 * POST /teams/:teamId/weekends
 * Body {'name': 'Singapore'}
 */
function createWeekend(req, res) {
    // Get the teamId from the URL (eg /teams/1/weekends)
    const teamId = getTeamIdOr400(req, res)

    // Stop if teamId is invalid
    if (teamId === null) { return }
    // Pull the weekend name from the request body
    const { name: name } = req.body || {}

    // Validate weekend name before continuing
    if (isInvalidName(name)) { return invalidInputErrorMessage(res, 'Weekend name is required') }

    // some() checks if at least one item passes a test
    const teamExists = teams.some((team) => team.id === teamId)

    if (!teamExists) {
        return res.status(404).json({ 'error': { 'code': ERROR_CODES.NOT_FOUND, 'message': 'Team not found' } })
    }

    // Check for duplicate weekend names within the same team
    const weekendExists = weekends.some(
        (weekend) => weekend.teamId === teamId && weekend.name === name.trim()
    )
    if (weekendExists) {
        // 409 means a Conflict
        return res.status(409).json({ 'error': { 'code': ERROR_CODES.DUPLICATE, 'message': 'This weekend already exists' } })
    }

    // Initialise the weekend object
    // id, teamId, name, stage, segment, createdAt, updatedAt
    const weekend = initialiseWeekend({ teamId, name })

    // Store the new weekend in memory
    weekends.push(weekend)

    return res.status(201).json(weekend)
}


/**
 * GET /teams/:teamId/weekends
 */
function listWeekends(req, res) {
    // Get the teamId from the URL (eg /teams/1/weekends)
    const teamId = getTeamIdOr400(req, res)
    // Stop if teamId is invalid
    if (teamId === null) { return }

    // Make sure the team exists before listing
    const teamExists = teams.some((team) => team.id === teamId)
    if (!teamExists) {
        return res.status(404).json({ 'error': { 'code': ERROR_CODES.NOT_FOUND, 'message': 'Team not found' } })
    }
    // Filter to only this team's weekends
    const teamWeekends = weekends.filter((weekend) => weekend.teamId === teamId)
    return res.json(teamWeekends)
}

// GET /teams/:teamId/weekends/:weekendId
function getWeekend(req, res) {
    // Get the teamId and weekendId from the URL
    const teamId = getTeamIdOr400(req, res)
    const weekendId = getWeekendIdOr400(req, res)
    // Stop if either id is invalid, the error response would have been sent in the getTeamId/ 
    if (teamId === null || weekendId === null) { return }

    // Make sure the team exists before searching
    const teamExists = teams.some((team) => team.id === teamId)
    if (!teamExists) {
        return res.status(404).json({ 'error': { 'code': ERROR_CODES.NOT_FOUND, 'message': 'Team not found' } })
    }

    // Find the weekend that matches both teamId and weekendId
    const weekend = getWeekendOr404(res, teamId, weekendId)
    if (!weekend) { return }

    return res.json(weekend)
}

// POST /teams/{teamId}/weekends/{weekendId}/transition - transition weekend stage
// Body: { 'toStage': 'Qualifying', 'toSegment': 'Q2' }
function transitionWeekendStage(req, res) {
    const { toStage: toStage, toSegment: toSegment } = req.body || {}

    // Get the teamId and weekendId from the URL
    const teamId = getTeamIdOr400(req, res)
    const weekendId = getWeekendIdOr400(req, res)
    // Stop if either id is invalid
    if (teamId === null || weekendId === null) { return }

    // Make sure the team exists before searching
    const teamExists = teams.some((team) => team.id === teamId)
    if (!teamExists) {
        return res.status(404).json({ 'error': { 'code': ERROR_CODES.NOT_FOUND, 'message': 'Team not found' } })
    }

    // Reuse the same weekend lookup logic
    let weekend = getWeekendOr404(res, teamId, weekendId)
    if (!weekend) { return }

    // check permisions with team leader

    const fromStage = weekend.stage

    if (!isValidStage(toStage)) {
        return res.status(409).json({ 'error': { 'code': ERROR_CODES.INVALID_TRANSITION, 'message': 'Invalid stage name' } })
    }
    if (!isValidSegment(toSegment)) {
        return res.status(409).json({ 'error': { 'code': ERROR_CODES.INVALID_TRANSITION, 'message': 'Invalid segment' } })
    }

    if (!canTransition(fromStage, toStage)) {
        return res.status(409).json({
            error: {
                code: ERROR_CODES.INVALID_TRANSITION,
                message: 'Workflow transition is not allowed from the current stage',
            },
        })
    }

    // updates stage + updatedAt
    weekend.stage = toStage

    if (canTransitionSegment(weekend.segment, toSegment, weekend.stage)) {
        weekend.segment = toSegment
    }
    weekend.updatedAt = new Date().toISOString()
    
    return res.status(201).json(weekend)
}


module.exports = {
    createWeekend,
    listWeekends,
    getWeekend,
    transitionWeekendStage,
}
