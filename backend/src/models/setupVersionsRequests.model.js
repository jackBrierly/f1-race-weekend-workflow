let nextSetupVersionRequestId = 0
const requests = []

function getRequest(id) {
    return requests.find(r => r.id === id)
}

function setupVersionRequestExistsForWeekend(setupVersionRequestId, weekendId) {
    return requests.some((request) => request.id === setupVersionRequestId && request.weekendId === weekendId)
}

function acceptSetupVersionRequest(id) {
    const request = getRequest(id)

    request.status = "ACCEPTED"
    request.acceptedAt = new Date().toISOString()

    return request
}

function declineSetupVersionRequest(id) {
    const request = getRequest(id)

    request.status = "DECLINED"
    request.declinedAt = new Date().toISOString()

    return request
}

function createSetupVersionRequest(
    teamId,
    weekendId,
    requestedBy,
    requestedByRole,
    requestedTo,
    requestedToRole,
    parameters
) {
    // store request as pending. There exist pending, accepted, declined, no longer valid.
    const newRequest = {
        id: nextSetupVersionRequestId++,
        teamId,
        weekendId,
        requestedBy,
        requestedByRole,
        requestedTo,
        requestedToRole,
        parameters,
        requestedAt: new Date().toISOString(),
        status: 'PENDING'
    }

    requests.push(newRequest)

    return newRequest
}

function resetSetupVersionsRequests() {
    // Clear in place so any module holding a reference sees the empty array
    requests.length = 0
    nextSetupVersionRequestId = 1
}

function listSetupVersionsRequestsForWeekend(weekendId) {
    return requests.filter(request => request.weekendId === weekendId)
}

module.exports = {
    getRequest,
    setupVersionRequestExistsForWeekend,
    acceptSetupVersionRequest,
    declineSetupVersionRequest,
    createSetupVersionRequest,
    resetSetupVersionsRequests,
    listSetupVersionsRequestsForWeekend,
}