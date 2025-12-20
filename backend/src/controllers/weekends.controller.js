// In memory storage
let nextWeekendId = 1
const weekends = []
const { teams } = require('../data/teams.data')

// Basic input validation
function isInvalidName(name) {
    return (!name || typeof name !== 'string' || name.trim().length === 0)
}
function invalidInputErrorMessage(res, message) {
    return res.status(400).json({ 'error': { 'code': 'BAD_REQUEST', 'message': message } })
}
function getTeamId(req, res) {
    // Read the teamId from the URL params (e.g. /teams/1/weekends).
    const teamId = Number.parseInt(req.params.teamId, 10)
    // If teamId is missing, not a number, or <= 0, return a 400 error.
    if (!Number.isInteger(teamId) || teamId <= 0) {
        invalidInputErrorMessage(res, 'Team id must be a positive integer')
        // Return null so the caller can stop.
        return null
    }
    // Return the validated teamId.
    return teamId
}

/**
 * POST /teams/:teamId/weekends
 * Body {'name': 'Singapore'}
 */
function createWeekend(req, res) {
    const teamId = getTeamId(req, res)

    if (teamId === null) { return }
    const { name: name } = req.body || {}

    if (isInvalidName(name)) { return invalidInputErrorMessage(res, 'Weekend name is required') }

    // .some() checks if at least one item passes a test
    const teamExists = teams.some((team) => team.id === teamId)

    if (!teamExists) {
        return res.status(404).json({ 'error': { 'code': 'NOT_FOUND', 'message': 'Team not found' } })
    }

    const weekendExists = weekends.some(
        (weekend) => weekend.teamId === teamId && weekend.name === name.trim()
    )
    if (weekendExists) {
        // 409 means a Conflict
        return res.status(409).json({ 'error': { 'code': 'DUPLICATE', 'message': 'This weekend already exists' } })
    }

    const weekend = {
        id: nextWeekendId++,
        name: name.trim(),
        createdAt: new Date().toISOString(),
        teamId: teamId,
    }

    weekends.push(weekend)

    return res.status(201).json(weekend)
}


/**
 * GET /teams/:teamId/weekends
 */
function listWeekends(req, res) {
    const teamId = getTeamId(req, res)
    if (teamId === null) { return }

    const teamExists = teams.some((team) => team.id === teamId)
    if (!teamExists) {
        return res.status(404).json({ 'error': { 'code': 'NOT_FOUND', 'message': 'Team not found' } })
    }
    const teamWeekends = weekends.filter((weekend) => weekend.teamId === teamId)
    return res.json(teamWeekends)
}


module.exports = {
    createWeekend,
    listWeekends,
}