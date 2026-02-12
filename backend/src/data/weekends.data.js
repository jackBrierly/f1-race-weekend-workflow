// In-memory weekends storage (shared across controllers)
let nextWeekendId = 1
const weekends = []

function getNextWeekendId() {
  return nextWeekendId++
}

function getWeekend(weekendId) {
  const weekend = weekends.find(w => w.id === weekendId)

  if (!weekend) {
    throw new Error('Weekend not found')
  }
  return weekend
}

function getNextVersionNumber(weekendId) {
  const weekend = getWeekend(weekendId)

  weekend.currentSetupVersionNumber += 1

  return weekend.currentSetupVersionNumber
}

function getStage(weekendId) {
  const weekend = getWeekend(weekendId)

  return weekend.stage
}

function getSegment(weekendId) {
  const weekend = getWeekend(weekendId)

  return weekend.segment
}

function resetWeekends() {
  // Clear in place so any module holding a reference sees the empty array
  weekends.length = 0
  nextWeekendId = 1
}

module.exports = {
  weekends,
  getNextWeekendId,
  getNextVersionNumber,
  getStage,
  getSegment,
  resetWeekends,
}