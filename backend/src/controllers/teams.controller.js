// Controllers handle HTTP request/response logic
// For Sprint 1 we keep storage in-memory (replace with a DB later)
const { teams, getNextTeamId } = require('../data/teams.data')

/**
 * POST /teams
 * Body: { name': 'Mercedes' }
 */
function createTeam(req, res) {
  // Extract the `name` value from the JSON request body (e.g. { 'name': 'McLaren' })
  const { name: name } = req.body || {}

  // Basic input validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ 'error': { 'code': 'BAD_REQUEST', 'message': 'Team name is required' } })
  }

  const team = {
    id: getNextTeamId(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  }

  teams.push(team)

  // Respond with HTTP 201 (Created) and return the created team in the response body.
  return res.status(201).json(team)
}

/**
 * GET /teams
 */
function listTeams(req, res) {
  return res.json(teams)
}

module.exports = {
  createTeam,
  listTeams,
}
