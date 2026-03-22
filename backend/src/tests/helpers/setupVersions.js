const request = require('supertest')

const baseParameters = () => ({
    frontWing: 32,
    rearWing: 28,
    rideHeightFront: 35,
    rideHeightRear: 45,
    camberFront: -3.2,
    camberRear: -1.8,
    toeFront: 0.05,
    toeRear: 0.20,
    diffEntry: 60,
    diffMid: 55,
    diffExit: 50,
    brakeBias: 56.5,
    brakePressure: 98
})

async function postSetupVersion(app, teamId, weekendId, payload) {
    return request(app)
        .post(`/teams/${teamId}/weekends/${weekendId}/setupVersions`)
        .send(payload)
}

async function listSetupVersions(app, teamId, weekendId) {
    return request(app).get(`/teams/${teamId}/weekends/${weekendId}/setupVersions`)
}

module.exports = {
    baseParameters,
    postSetupVersion,
    listSetupVersions,
}
