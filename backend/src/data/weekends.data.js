// In-memory weekends storage (shared across controllers)
let nextWeekendId = 1
const weekends = []

function getNextWeekendId() {
  return nextWeekendId++
}

function resetWeekends() {
  // Clear in place so any module holding a reference sees the empty array
  weekends.length = 0
  nextWeekendId = 1
}

module.exports = {
  weekends,
  getNextWeekendId,
  resetWeekends,
}