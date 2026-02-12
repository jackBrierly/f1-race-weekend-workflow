// In-memory weekends storage (shared across controllers)
let nextWeekendId = 1
const weekends = []
// Keep storage private; only modify via the helpers below.

function getNextWeekendId() {
  return nextWeekendId++
}

function addWeekend(weekend) {
  weekends.push(weekend)
  return weekend
}

function findWeekendByTeamAndId(teamId, weekendId) {
  return weekends.find((weekend) => weekend.teamId === teamId && weekend.id === weekendId)
}

function listWeekendsByTeam(teamId) {
  return weekends.filter((weekend) => weekend.teamId === teamId)
}

function weekendNameExistsForTeam(teamId, name) {
  return weekends.some((weekend) => weekend.teamId === teamId && weekend.name === name)
}

function resetWeekends() {
  // Clear in place so any module holding a reference sees the empty array
  weekends.length = 0
  nextWeekendId = 1
}

module.exports = {
  addWeekend,
  findWeekendByTeamAndId,
  listWeekendsByTeam,
  weekendNameExistsForTeam,
  getNextWeekendId,
  resetWeekends,
}
