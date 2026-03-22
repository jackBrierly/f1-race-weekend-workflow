const request = require('supertest')

async function postSetupVersionRequest(app, teamId, weekendId, payload) {
    return request(app)
        .post(`/teams/${teamId}/weekends/${weekendId}/setupVersionsRequests`)
        .send(payload)
}

async function postAcceptSetupVersionRequest(app, teamId, weekendId, requestId, payload) {
    return request(app)
        .post(`/teams/${teamId}/weekends/${weekendId}/setupVersionsRequests/${requestId}/accept`)
        .send(payload)
}

async function postDeclineSetupVersionRequest(app, teamId, weekendId, requestId, payload) {
    return request(app)
        .post(`/teams/${teamId}/weekends/${weekendId}/setupVersionsRequests/${requestId}/decline`)
        .send(payload)
}

async function listSetupVersionRequests(app, teamId, weekendId) {
    return request(app).get(`/teams/${teamId}/weekends/${weekendId}/setupVersionsRequests`)
}

module.exports = {
    postSetupVersionRequest,
    postAcceptSetupVersionRequest,
    postDeclineSetupVersionRequest,
    listSetupVersionRequests,
}
