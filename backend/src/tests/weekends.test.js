const request = require('supertest')
const app = require('../app')
const { resetTeams } = require('../data/teams.data')
const { resetWeekends } = require('../data/weekends.data')
const { WORKFLOW_STAGES } = require('../constants/workflow-stages')
const { PRACTICE_SEGMENTS } = require('../constants/segments')
const { ROLES } = require('../constants/roles')

// Small helper so we don't repeat POST boilerplate everywhere
async function createTeam(name) {
    return request(app).post('/teams').send({ name })
}

async function createWeekend(id, name) {
    return request(app).post(`/teams/${id}/weekends`).send({ name: name })
}

async function listWeekends(teamId) {
    return request(app).get(`/teams/${teamId}/weekends`)
}

async function getWeekend(teamId, weekendId) {
    return request(app).get(`/teams/${teamId}/weekends/${weekendId}`)
}

async function transitionWeekend(teamId, weekendId, payload) {
    return request(app)
        .post(`/teams/${teamId}/weekends/${weekendId}/transition`)
        .send({
            actorName: 'Alex Engineer',
            actorRole: ROLES.LEAD_ENGINEER,
            ...payload,
        })
}

beforeEach(() => {
    resetTeams()
    resetWeekends()
})

describe('Weekends API', () => {
    // POST /teams/:teamId/weekends - create a weekend for a team
    describe('POST /teams/:teamId/weekends', () => {
        test('201 when valid', async () => {
            const team = await createTeam('Mclaren')
            const res = await createWeekend(team.body.id, '  Australia  ')

            expect(res.statusCode).toBe(201)
            expect(res.body).toEqual(expect.objectContaining({
                id: expect.any(Number),
                teamId: team.body.id,
                name: 'Australia',
                stage: WORKFLOW_STAGES.PRACTICE,
                segment: null,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
            }))
        })
        test('400 when id not a number', async () => {
            const res = await createWeekend('id', 'Australia')
            expect(res.statusCode).toBe(400)

        })
        test('400 when id is <= 0', async () => {
            const res = await createWeekend(0, 'Australia')
            expect(res.statusCode).toBe(400)

        })
        test('400 when name is missing or empty after trimming', async () => {
            const team = await createTeam('Mclaren')
            const res = await createWeekend(team.body.id, ' ')
            expect(res.statusCode).toBe(400)
        })
        test('400 when name is not a string', async () => {
            const team = await createTeam('Mclaren')
            const res = await createWeekend(team.body.id, 123)
            expect(res.statusCode).toBe(400)
        })
        test('404 when team not found', async () => {
            const res = await createWeekend(1, 'Australia')
            expect(res.statusCode).toBe(404)
        })
        test('409 when weekend already exists', async () => {
            const team = await createTeam('Mclaren')
            await createWeekend(team.body.id, 'Australia')
            const res = await createWeekend(team.body.id, '  Australia  ')
            expect(res.statusCode).toBe(409)
        })

        test('Content-Type is JSON', async () => {
            const team = await createTeam('Mclaren')
            const res = await createWeekend(team.body.id, 'Australia')
            expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))
        })
    })

    // GET /teams/:teamId/weekends
    describe('GET /teams/:teamId/weekends', () => {
        test('200 with empty list when team has no weekends', async () => {
            const team = await createTeam('Mclaren')
            const res = await listWeekends(team.body.id)

            expect(res.statusCode).toBe(200)
            expect(res.body).toEqual([])
        })

        test('200 returns only weekends for the requested team', async () => {
            const teamOne = await createTeam('Mclaren')
            const teamTwo = await createTeam('Ferrari')

            const weekendOne = await createWeekend(teamOne.body.id, 'Australia')
            await createWeekend(teamTwo.body.id, 'Japan')

            const res = await listWeekends(teamOne.body.id)

            expect(res.statusCode).toBe(200)
            expect(res.body).toHaveLength(1)
            expect(res.body[0].id).toBe(weekendOne.body.id)
        })

        test('400 when team id is invalid', async () => {
            const res = await listWeekends('nope')
            expect(res.statusCode).toBe(400)
        })

        test('404 when team not found', async () => {
            const res = await listWeekends(999)
            expect(res.statusCode).toBe(404)
        })
    })

    // GET /teams/:teamId/weekends/:weekendId
    describe('GET /teams/:teamId/weekends/:weekendId', () => {
        test('200 when weekend exists for team', async () => {
            const team = await createTeam('Mclaren')
            const weekend = await createWeekend(team.body.id, 'Australia')

            const res = await getWeekend(team.body.id, weekend.body.id)

            expect(res.statusCode).toBe(200)
            expect(res.body.id).toBe(weekend.body.id)
        })

        test('400 when team id is invalid', async () => {
            const res = await getWeekend('bad', 1)
            expect(res.statusCode).toBe(400)
        })

        test('400 when weekend id is invalid', async () => {
            const team = await createTeam('Mclaren')
            const res = await getWeekend(team.body.id, 'bad')
            expect(res.statusCode).toBe(400)
        })

        test('404 when weekend not found', async () => {
            const team = await createTeam('Mclaren')
            const res = await getWeekend(team.body.id, 999)
            expect(res.statusCode).toBe(404)
        })
    })

    // POST /teams/{teamId}/weekends/{weekendId}/transition - transition weekend stage
    // Body: { 'toStage': 'Qualifying', 'toSegment': 'Q2' }
    describe('POST /teams/{teamId}/weekends/{weekendId}/transition', () => {
        test('201 when stage/segment transition is valid', async () => {
            const team = await createTeam('Mclaren')
            const weekend = await createWeekend(team.body.id, 'Australia')

            const res = await transitionWeekend(team.body.id, weekend.body.id, {
                toStage: WORKFLOW_STAGES.PRACTICE,
                toSegment: PRACTICE_SEGMENTS.P1,
            })

            expect(res.statusCode).toBe(201)
            expect(res.body.stage).toBe(WORKFLOW_STAGES.PRACTICE)
            expect(res.body.segment).toBe(PRACTICE_SEGMENTS.P1)
        })

        test('400 when stage is invalid', async () => {
            const team = await createTeam('Mclaren')
            const weekend = await createWeekend(team.body.id, 'Australia')

            const res = await transitionWeekend(team.body.id, weekend.body.id, {
                toStage: 'NotAStage',
                toSegment: PRACTICE_SEGMENTS.P1,
            })

            expect(res.statusCode).toBe(400)
        })

        test('400 when segment is invalid', async () => {
            const team = await createTeam('Mclaren')
            const weekend = await createWeekend(team.body.id, 'Australia')

            const res = await transitionWeekend(team.body.id, weekend.body.id, {
                toStage: WORKFLOW_STAGES.PRACTICE,
                toSegment: 'P9',
            })

            expect(res.statusCode).toBe(400)
        })

        test('409 when transition is not allowed', async () => {
            const team = await createTeam('Mclaren')
            const weekend = await createWeekend(team.body.id, 'Australia')

            const res = await transitionWeekend(team.body.id, weekend.body.id, {
                toStage: WORKFLOW_STAGES.RACE,
            })

            expect(res.statusCode).toBe(409)
        })

        test('404 when weekend does not exist', async () => {
            const team = await createTeam('Mclaren')

            const res = await transitionWeekend(team.body.id, 999, {
                toStage: WORKFLOW_STAGES.PRACTICE,
                toSegment: PRACTICE_SEGMENTS.P1,
            })

            expect(res.statusCode).toBe(404)
        })

        test('400 when teamId is invalid (transition)', async () => {
            const team = await createTeam('Mclaren')
            const weekend = await createWeekend(team.body.id, 'Australia')

            const res = await transitionWeekend('bad', weekend.body.id, {
                toStage: WORKFLOW_STAGES.PRACTICE,
                toSegment: PRACTICE_SEGMENTS.P1,
            })

            expect(res.statusCode).toBe(400)
        })

        test('400 when weekendId is invalid (transition)', async () => {
            const team = await createTeam('Mclaren')
            const weekend = await createWeekend(team.body.id, 'Australia')

            const res = await transitionWeekend(team.body.id, 'bad', {
                toStage: WORKFLOW_STAGES.PRACTICE,
                toSegment: PRACTICE_SEGMENTS.P1,
            })

            expect(res.statusCode).toBe(400)
        })

        test('400 when actor role is missing', async () => {
            const team = await createTeam('Mclaren')
            const weekend = await createWeekend(team.body.id, 'Australia')

            const res = await request(app)
                .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/transition`)
                .send({
                    actorName: 'Alex Engineer',
                    toStage: WORKFLOW_STAGES.PRACTICE,
                    toSegment: PRACTICE_SEGMENTS.P1,
                })

            expect(res.statusCode).toBe(400)
        })

        test('403 when actor role is not lead engineer', async () => {
            const team = await createTeam('Mclaren')
            const weekend = await createWeekend(team.body.id, 'Australia')

            const res = await request(app)
                .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/transition`)
                .send({
                    actorName: 'Alex Engineer',
                    actorRole: ROLES.ENGINEER,
                    toStage: WORKFLOW_STAGES.PRACTICE,
                    toSegment: PRACTICE_SEGMENTS.P1,
                })

            expect(res.statusCode).toBe(403)
        })

        test('400 when actorName is missing or empty after trimming', async () => {

            const team = await createTeam('Mclaren')
            const weekend = await createWeekend(team.body.id, 'Australia')

            const res = await request(app)
                .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/transition`)
                .send({
                    actorName: ' ',
                    actorRole: ROLES.LEAD_ENGINEER,
                    toStage: WORKFLOW_STAGES.PRACTICE,
                    toSegment: PRACTICE_SEGMENTS.P1,
                })
            expect(res.statusCode).toBe(400)
        })
        test('400 when actorName is not a string', async () => {
            const team = await createTeam('Mclaren')
            const weekend = await createWeekend(team.body.id, 'Australia')

            const res = await request(app)
                .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/transition`)
                .send({
                    actorName: 123,
                    actorRole: ROLES.LEAD_ENGINEER,
                    toStage: WORKFLOW_STAGES.PRACTICE,
                    toSegment: PRACTICE_SEGMENTS.P1,
                })
            expect(res.statusCode).toBe(400)
        })
        test('Content-Type is JSON', async () => {
            const team = await createTeam('Mclaren')
            const weekend = await createWeekend(team.body.id, 'Australia')

            const res = await transitionWeekend(team.body.id, weekend.body.id, {
                toStage: WORKFLOW_STAGES.PRACTICE,
                toSegment: PRACTICE_SEGMENTS.P1,
            })

            expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))
        })
    })

})
