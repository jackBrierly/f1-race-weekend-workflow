const request = require('supertest')
const app = require('../app')
const { resetTeams } = require('../data/teams.data')
const { resetWeekends } = require('../data/weekends.data')
const { resetAudit } = require('../data/audit.data')
const { resetSetupVersions } = require('../data/setupVersions.data')
const setupVersionsRequestsModel = require('../models/setupVersionsRequests.model')
const { WORKFLOW_STAGES } = require('../constants/workflow-stages')
const { PRACTICE_SEGMENTS, QUALIFYING_SEGMENTS } = require('../constants/segments')
const { ROLES } = require('../constants/roles')
const { STATES } = require('../constants/states')
const {
    createTeamWeekend,
    transitionWeekend,
    baseParameters,
    advanceP1ToQ1,
    advanceP1ToReview,
} = require('./helpers/api')

/**
 * Returns a default valid payload (data being sent) for tests.
 * You can pass in an `overrides` object to replace any default fields.
 * Example: basePayload({ createdBy: "Lewis Hamilton" }) replaces createdBy.
 */
function basePayload(overrides = {}) {
    return {
        // changeRequestId: null,
        parameters: baseParameters(),
        requestedBy: 'Jack Brierly',
        requestedByRole: ROLES.ENGINEER,
        requestedTo: 'John Parker',
        requestedToRole: ROLES.LEAD_ENGINEER,
        ...overrides, // overrides key/value pairs into the object (spread last so they overwrite defaults)
    }
}

beforeEach(() => {
    resetTeams()
    resetWeekends()
    resetAudit()
    resetSetupVersions()
})

describe('SetupVersionsRequests API', () => {
    describe('POST /teams/:teamId/weekends/:weekendId/setupVersionsRequests', () => {

        // Happy Path
        test('Happy Path: 201 when valid request is made', async () => {
            const { team, weekend } = await createTeamWeekend(app)

            await advanceP1ToQ1(app, team.body.id, weekend.body.id)

            const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                .send(basePayload())

            expect(res.statusCode).toBe(201)

        })

        test('Contract Test: Happy Path returns the correct body and in JSON', async () => {
            const { team, weekend } = await createTeamWeekend(app)
            const parameters = baseParameters()
            const requestedBy = 'Jack Brierly'
            const requestedByRole = ROLES.ENGINEER
            const requestedTo = 'John Contract'
            const requestedToRole = ROLES.LEAD_ENGINEER


            await advanceP1ToQ1(app, team.body.id, weekend.body.id)

            const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                .send(basePayload({ parameters, requestedBy, requestedByRole, requestedTo, requestedToRole }))

            expect(res.body).toEqual(expect.objectContaining({
                id: 1,
                teamId: team.body.id,
                weekendId: weekend.body.id,
                requestedBy,
                requestedByRole,
                requestedTo,
                requestedToRole,
                parameters,
                requestedAt: expect.any(String),
                status: 'PENDING'
            }))
        })

        describe('Validation Tests: ways the BODY can be wrong', () => {

            /**
             * Path params:
             * teamId: missing - not an integer (string, float, boolean) - <= 0
             * 
             * weekendId: missing - not an integer (string, float, boolean) - <= 0
             * 
             */

            test('teamId missing returns 404', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams//weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload())

                expect(res.statusCode).toBe(404)


            })

            test('teamId as a string returns 400', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/one/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload())

                expect(res.statusCode).toBe(400)
            })

            test('teamId as a float returns 400', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${1.0191}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload())

                expect(res.statusCode).toBe(400)

            })

            test('teamId as a boolean returns 400', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${true}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload())

                expect(res.statusCode).toBe(400)
            })

            test('teamId <= 0 returns 400', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${0}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload())

                expect(res.statusCode).toBe(400)
            })

            test('weekendId missing returns 404', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends//setupVersionsRequests`)
                    .send(basePayload())

                expect(res.statusCode).toBe(404)

            })

            test('weekendId as a string returns 400', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/one/setupVersionsRequests`)
                    .send(basePayload())

                expect(res.statusCode).toBe(400)
            })

            test('weekendId as a float returns 400', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${1.2891}/setupVersionsRequests`)
                    .send(basePayload())

                expect(res.statusCode).toBe(400)

            })

            test('weekendId as a boolean returns 400', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${false}/setupVersionsRequests`)
                    .send(basePayload())

                expect(res.statusCode).toBe(400)
            })

            test('weekendId <= 0 returns 400', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${-1}/setupVersionsRequests`)
                    .send(basePayload())

                expect(res.statusCode).toBe(400)
            })

            /**
             * Body params:
             * parameters: missing | null | array | not object
             * requestedBy: missing | not string | whitespace
             * requestedByRole: missing | not string | invalid enum
             */


            // parameters: missing | null | array | not object
            test('parameters missing returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const payload = basePayload()
                delete payload.parameters

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })
            test('parameters as null returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send({ parameters: null })

                expect(res.statusCode).toBe(400)
            })
            test('parameters as array returns 400', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send({ parameters: [] })

                expect(res.statusCode).toBe(400)
            })
            test('parameters as not an object returns 400', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send({ parameters: "not object" })

                expect(res.statusCode).toBe(400)
            })

            // requestedBy: missing | not string | whitespace
            test('requestedBy as missing returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const payload = basePayload()
                delete payload.requestedBy

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })
            test('requestedBy as an int returns 400', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)


                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload({ requestedBy: 12 }))

                expect(res.statusCode).toBe(400)
            })
            test('requestedBy as a bool returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)


                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload({ requestedBy: true }))

                expect(res.statusCode).toBe(400)
            })
            test('requestedBy as null returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload({ requestedBy: null }))

                expect(res.statusCode).toBe(400)
            })
            test('requestedBy as whitespace returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload({ requestedBy: " " }))

                expect(res.statusCode).toBe(400)
            })

            // requestedBy: missing | not string | whitespace
            test('requestedTo as missing returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const payload = basePayload()
                delete payload.requestedTo

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })
            test('requestedTo as an int returns 400', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)


                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload({ requestedTo: 12 }))

                expect(res.statusCode).toBe(400)
            })
            test('requestedTo as a bool returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)


                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload({ requestedTo: true }))

                expect(res.statusCode).toBe(400)
            })
            test('requestedTo as null returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload({ requestedTo: null }))

                expect(res.statusCode).toBe(400)
            })
            test('requestedTo as whitespace returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload({ requestedTo: " " }))

                expect(res.statusCode).toBe(400)
            })

            // createdByRole: missing | not string | invalid enum
            test('requestedToRole as missing returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const payload = basePayload()
                delete payload.requestedToRole

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })
            test('requestedToRole as an int returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload({ requestedToRole: 12 }))

                expect(res.statusCode).toBe(400)
            })
            test('requestedToRole as a bool returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload({ requestedToRole: true }))

                expect(res.statusCode).toBe(400)
            })
            test('requestedToRole as null returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload({ requestedToRole: null }))

                expect(res.statusCode).toBe(400)
            })
            test('requestedToRole as invalid enum returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                // this should be an error as we only read it as uppercase
                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}}/setupVersionsRequests`)
                    .send(basePayload({ requestedToRole: "engineer" }))

                expect(res.statusCode).toBe(400)
            })

            // createdByRole: missing | not string | invalid enum
            test('requestedByRole as missing returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const payload = basePayload()
                delete payload.requestedToRole

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })
            test('requestedByRole as an int returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload({ requestedToRole: 12 }))

                expect(res.statusCode).toBe(400)
            })
            test('requestedByRole as a bool returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload({ requestedToRole: true }))

                expect(res.statusCode).toBe(400)
            })
            test('requestedByRole as null returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload({ requestedToRole: null }))

                expect(res.statusCode).toBe(400)
            })
            test('requestedByRole as invalid enum returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}}/setupVersionsRequests`)
                    .send(basePayload({ requestedToRole: "engineer" }))

                expect(res.statusCode).toBe(400)
            })
        })

        describe('Existence Tests: endpoint called correctly, but the thing referenced does not exist.', () => {

            test('team does not exist returns 404', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${2}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload())

                expect(res.statusCode).toBe(404)
            })
            test('weekend does not exist returns 404', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${2}/setupVersionsRequests`)
                    .send(basePayload())

                expect(res.statusCode).toBe(404)
            })
        })

        describe('Business rule tests: ways it can be valid input but still not allowed', () => {
            test('request setup version without during practice returns 409', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload())

                expect(res.statusCode).toBe(409)

            })
            test('409 when requesting setup during review', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToReview(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload())

                expect(res.statusCode).toBe(409)
            })

            test('400 when requestedByRole is not ENGINEER', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload({ requestedByRole: ROLES.LEAD_ENGINEER }))

                expect(res.statusCode).toBe(400)
            })
            test('400 when requestedToRole is not LEAD_ENGINEER', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(basePayload({ requestedToRole: ROLES.ENGINEER }))

                expect(res.statusCode).toBe(400)
            })

        })
    })
})