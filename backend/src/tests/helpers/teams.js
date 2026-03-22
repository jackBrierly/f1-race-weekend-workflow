const request = require('supertest')

async function postTeam(app, payload) {
    return request(app).post('/teams').send(payload)
}

async function listTeams(app) {
    return request(app).get('/teams')
}

async function getTeam(app, teamId) {
    return request(app).get(`/teams/${teamId}`)
}

module.exports = {
    postTeam,
    listTeams,
    getTeam,
}
