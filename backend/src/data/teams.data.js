// In-memory teams storage (shared across controllers).
let nextTeamId = 1
const teams = []

function getNextTeamId() {
  return nextTeamId++
}

module.exports = {
  teams,
  getNextTeamId,
}
