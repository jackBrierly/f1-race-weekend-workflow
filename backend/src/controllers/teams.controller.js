// Controllers handle HTTP request/response logic

// Import the shared teams list and the id generator
// {} is used when you want specific properties from an object (destructuring)
const { teams, getNextTeamId } = require('../data/teams.data')

/**
 * POST /teams
 * Body: { 'name': 'Mercedes' }
 */
function createTeam(req, res) {
  // Extract the `name` value from the JSON request body (eg { 'name': 'McLaren' })
  const { name: name } = req.body || {}

  // Basic input validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ 'error': { 'code': 'BAD_REQUEST', 'message': 'Team name is required' } })
  }

  // Build a new team object with a unique id and timestamp
  const team = {
    id: getNextTeamId(),
    name: name.trim(),
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
  return res.json(teams)
}

module.exports = {
  createTeam,
  listTeams,
}
