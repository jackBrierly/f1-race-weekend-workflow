// In-memory teams storage (shared across controllers)
let nextTeamId = 1
const teams = []

function getNextTeamId() {
  // Return the current id and then increment it for next time
  return nextTeamId++
}

module.exports = {
  teams,
  getNextTeamId,
}
