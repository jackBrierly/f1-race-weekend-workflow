let nextSetupVersionRequestId = 0
const requests = []

exports.createSetupVersionRequest = (
    teamId,
    weekendId,
    requestedBy,
    requestedByRole,
    requestedTo,
    requestedToRole,
    parameters
) => {
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

exports.resetSetupVersionsRequests = () => {
    // Clear in place so any module holding a reference sees the empty array
    requests.length = 0
    nextSetupVersionRequestId = 1
}