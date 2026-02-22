// In-memory teams storage (shared across controllers)
let nextTeamId = 1
const teams = []
// Keep storage private; only modify via the helpers below.

function getNextTeamId() {
  // Return the current id and then increment it for next time
  return nextTeamId++
}

function addTeam(team) {
  teams.push(team)
  return team
}

function listTeams() {
  return teams.slice()
}

function findTeamById(teamId) {
  return teams.find((team) => team.id === teamId) || null
}

function teamExistsById(teamId) {
  return teams.some((team) => team.id === teamId)
}

function teamNameExists(normalisedName) {
  return teams.some((team) => team.name.toLowerCase() === normalisedName)
}

function resetTeams() {
  teams.length = 0   // clear array in-place
  nextTeamId = 1
}

module.exports = {
  addTeam,
  listTeams,
  findTeamById,
  teamExistsById,
  teamNameExists,
  getNextTeamId,
  resetTeams,
}
