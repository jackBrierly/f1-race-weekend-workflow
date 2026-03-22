const request = require('supertest')
const { ROLES } = require('../../constants/roles')
const { WORKFLOW_STAGES } = require('../../constants/workflow-stages')
const { PRACTICE_SEGMENTS, QUALIFYING_SEGMENTS } = require('../../constants/segments')
const { postTeam } = require('./teams')

async function postWeekend(app, teamId, payload) {
    return request(app).post(`/teams/${teamId}/weekends`).send(payload)
}

async function listWeekends(app, teamId) {
    return request(app).get(`/teams/${teamId}/weekends`)
}

async function getWeekend(app, teamId, weekendId) {
    return request(app).get(`/teams/${teamId}/weekends/${weekendId}`)
}

async function postTransition(app, teamId, weekendId, payload) {
    return request(app)
        .post(`/teams/${teamId}/weekends/${weekendId}/transition`)
        .send({
            actorName: 'Alex Engineer',
            actorRole: ROLES.LEAD_ENGINEER,
            ...payload,
        })
}

async function createTeamWeekend(app) {
    const team = await postTeam(app, { name: 'Mclaren' })
    const weekend = await postWeekend(app, team.body.id, { name: 'Australia' })
    return { team, weekend }
}

async function advanceP1ToQ1(app, teamId, weekendId) {
    await postTransition(app, teamId, weekendId, {
        toStage: WORKFLOW_STAGES.PRACTICE,
        toSegment: PRACTICE_SEGMENTS.P1,
    })
    await postTransition(app, teamId, weekendId, {
        toStage: WORKFLOW_STAGES.PRACTICE,
        toSegment: PRACTICE_SEGMENTS.P2,
    })
    await postTransition(app, teamId, weekendId, {
        toStage: WORKFLOW_STAGES.PRACTICE,
        toSegment: PRACTICE_SEGMENTS.P3,
    })
    await postTransition(app, teamId, weekendId, {
        toStage: WORKFLOW_STAGES.QUALIFYING,
        toSegment: QUALIFYING_SEGMENTS.NULL,
    })
    return postTransition(app, teamId, weekendId, {
        toStage: WORKFLOW_STAGES.QUALIFYING,
        toSegment: QUALIFYING_SEGMENTS.Q1,
    })
}

async function advanceQ1ToReview(app, teamId, weekendId) {
    await postTransition(app, teamId, weekendId, {
        toStage: WORKFLOW_STAGES.QUALIFYING,
        toSegment: QUALIFYING_SEGMENTS.Q2,
    })
    await postTransition(app, teamId, weekendId, {
        toStage: WORKFLOW_STAGES.QUALIFYING,
        toSegment: QUALIFYING_SEGMENTS.Q3,
    })
    await postTransition(app, teamId, weekendId, {
        toStage: WORKFLOW_STAGES.RACE,
        toSegment: QUALIFYING_SEGMENTS.NULL,
    })
    return postTransition(app, teamId, weekendId, {
        toStage: WORKFLOW_STAGES.REVIEW,
        toSegment: QUALIFYING_SEGMENTS.NULL,
    })
}

async function advanceP1ToReview(app, teamId, weekendId) {
    await advanceP1ToQ1(app, teamId, weekendId)
    await advanceQ1ToReview(app, teamId, weekendId)
}

async function givenQualifyingWeekend(app) {
    const { team, weekend } = await createTeamWeekend(app)
    await advanceP1ToQ1(app, team.body.id, weekend.body.id)
    return { team, weekend }
}

module.exports = {
    postWeekend,
    listWeekends,
    getWeekend,
    postTransition,
    createTeamWeekend,
    givenQualifyingWeekend,
    advanceP1ToQ1,
    advanceQ1ToReview,
    advanceP1ToReview,
}
