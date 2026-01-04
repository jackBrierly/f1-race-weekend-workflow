const auditEvents = []
let nextAuditId = 1

function getNextAuditId() {
  // Return the current id and then increment it for next time
  return nextAuditId++
}

function logAuditTransition(event) {
    auditEvents.push(event)
}

function getAuditForWeekend(teamId, weekendId) {
    return auditEvents.filter(
        e => e.teamId === teamId && e.weekendId === weekendId
    )
}

function resetAudit() {
    auditEvents.length = 0
    nextAuditId = 1
}

module.exports = {
    logAuditTransition,
    getNextAuditId,
    getAuditForWeekend,
    resetAudit,
}
