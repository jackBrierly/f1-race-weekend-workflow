// In-memory setupVersions storage (shared across controllers)

let nextSetupVersionId = 1
const setupVersions = []

function getNextSetupVersionId() {
  return nextSetupVersionId++
}

function resetSetupVersions() {
  // Clear in place so any module holding a reference sees the empty array
  setupVersions.length = 0
  nextSetupVersionId = 1
}

module.exports = {
  setupVersions,
  getNextSetupVersionId,
  resetSetupVersions,
}