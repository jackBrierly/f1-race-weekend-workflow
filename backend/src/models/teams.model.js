let nextTeamId = 1
const teams = []

function createTeam(name) {
  const team = {
    id: nextTeamId++,
    name,
    createdAt: new Date().toISOString(),
  }

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
  teams.length = 0
  nextTeamId = 1
}

module.exports = {
  createTeam,
  listTeams,
  findTeamById,
  teamExistsById,
  teamNameExists,
  resetTeams,
}
