// Controllers handle HTTP request/response logic

// Import the shared teams list and the id generator
// {} is used when you want specific properties from an object (destructuring)
const { teams, getNextTeamId } = require('../data/teams.data')
const { ERROR_CODES } = require('../constants/error-codes')

/**
 * POST /teams
 * Body: { 'name': 'Mercedes' }
 */
function createTeam(req, res) {
  // Extract the `name` value from the JSON request body (eg { 'name': 'McLaren' })
  const { name: name } = req.body || {}

  // Basic input validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ 'error': { 'code': ERROR_CODES.BAD_REQUEST, 'message': 'Team name is required' } })
  }

  const trimmedName = name.trim()
  const normalisedName = trimmedName.toLowerCase()
  const duplicateTeam = teams.some((team) => team.name.toLowerCase() === normalisedName)
  if (duplicateTeam) {
    return res.status(409).json({ 'error': { 'code': ERROR_CODES.DUPLICATE, 'message': 'Team name already exists' } })
  }

  // Build a new team object with a unique id and timestamp
  const team = {
    id: getNextTeamId(),
    name: trimmedName,
    createdAt: new Date().toISOString(),
  }

  // Store the new team in memory
  teams.push(team)

  // Respond with HTTP 201 (Created) and return the created team in the response body
  return res.status(201).json(team)
}

/**
 * GET /teams
 */
function listTeams(req, res) {
  // Return all teams currently in memory
  return res.status(200).json(teams)
}

function getTeam(req, res) {
  const teamId = Number.parseInt(req.params.teamId, 10)

  if (!Number.isInteger(teamId) || teamId <= 0) {
    return res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Team id must be a positive integer' },
    })
  }

  const team = teams.find((t) => t.id === teamId)

  if (!team) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Team not found' },
    })
  }

  return res.status(200).json(team)
}

module.exports = {
  createTeam,
  listTeams,
  getTeam,
}
