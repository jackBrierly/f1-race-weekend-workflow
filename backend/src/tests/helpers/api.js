const request = require('supertest')
const { ROLES } = require('../../constants/roles')
const { WORKFLOW_STAGES } = require('../../constants/workflow-stages')
const { PRACTICE_SEGMENTS, QUALIFYING_SEGMENTS } = require('../../constants/segments')

// Small helper so we don't repeat POST boilerplate everywhere
async function createTeam(name, app) {
    return request(app).post('/teams').send({ name })
}

async function createWeekend(id, name, app) {
    return request(app).post(`/teams/${id}/weekends`).send({ name: name })
}

// Create the team + weekend once per test so we can focus on the variation.
async function createTeamWeekend(app) {
    const team = await createTeam('Mclaren', app)
    const weekend = await createWeekend(team.body.id, 'Australia', app)
    return { team, weekend }
}

async function transitionWeekend(app, teamId, weekendId, payload) {
    return request(app)
        .post(`/teams/${teamId}/weekends/${weekendId}/transition`)
        .send({
            actorName: 'Alex Engineer',
            actorRole: ROLES.LEAD_ENGINEER,
            ...payload,
        })
}

async function advanceP1ToQ1(app, teamId, weekendId) {

    await transitionWeekend(app, teamId, weekendId, {
        toStage: WORKFLOW_STAGES.PRACTICE,
        toSegment: PRACTICE_SEGMENTS.P1,
    })
    await transitionWeekend(app, teamId, weekendId, {
        toStage: WORKFLOW_STAGES.PRACTICE,
        toSegment: PRACTICE_SEGMENTS.P2,
    })
    await transitionWeekend(app, teamId, weekendId, {
        toStage: WORKFLOW_STAGES.PRACTICE,
        toSegment: PRACTICE_SEGMENTS.P3,
    })
    await transitionWeekend(app, teamId, weekendId, {
        toStage: WORKFLOW_STAGES.QUALIFYING,
        toSegment: QUALIFYING_SEGMENTS.NULL,
    })
    return await transitionWeekend(app, teamId, weekendId, {
        toStage: WORKFLOW_STAGES.QUALIFYING,
        toSegment: QUALIFYING_SEGMENTS.Q1,
    })
}

async function advanceP1ToReview(app, teamId, weekendId) {
    await advanceP1ToQ1(app, teamId, weekendId)
    await transitionWeekend(app, teamId, weekendId, {
        toStage: WORKFLOW_STAGES.QUALIFYING,
        toSegment: QUALIFYING_SEGMENTS.Q2,
    })
    await transitionWeekend(app, teamId, weekendId, {
        toStage: WORKFLOW_STAGES.QUALIFYING,
        toSegment: QUALIFYING_SEGMENTS.Q3,
    })
    await transitionWeekend(app, teamId, weekendId, {
          toStage: WORKFLOW_STAGES.RACE,
        toSegment: QUALIFYING_SEGMENTS.NULL,
    })
    return await transitionWeekend(app, teamId, weekendId, {
          toStage: WORKFLOW_STAGES.REVIEW,
        toSegment: QUALIFYING_SEGMENTS.NULL,
    })

}

// Base test data with small overrides to keep cases readable.
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

module.exports = {
    createTeam,
    createWeekend,
    createTeamWeekend,
    transitionWeekend,
    baseParameters,
    advanceP1ToQ1,
    advanceP1ToReview,
}
