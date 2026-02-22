const request = require('supertest')
const app = require('../app')
const { resetTeams } = require('../data/teams.data')
const { resetWeekends } = require('../data/weekends.data')
const { resetAudit } = require('../data/audit.data')
const { resetSetupVersions } = require('../data/setupVersions.data')
const { WORKFLOW_STAGES } = require('../constants/workflow-stages')
const { PRACTICE_SEGMENTS, QUALIFYING_SEGMENTS } = require('../constants/segments')
const { ROLES } = require('../constants/roles')
const { STATES } = require('../constants/states')
const { createTeamWeekend, transitionWeekend, advanceP1ToQ1 } = require('./helpers/api')


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

/**
 * Returns a default valid payload (data being sent) for tests.
 * You can pass in an `overrides` object to replace any default fields.
 * Example: basePayload({ createdBy: "Lewis Hamilton" }) replaces createdBy.
 */
function basePayload(overrides = {}) {
    return {
        changeRequestId: null,
        parameters: baseParameters(),
        createdBy: 'Jack Brierly',
        createdByRole: ROLES.ENGINEER,
        ...overrides, // overrides key/value pairs into the object (spread last so they overwrite defaults)
    }
}

beforeEach(() => {
    resetTeams()
    resetWeekends()
    resetAudit()
    resetSetupVersions()
})

describe('SetupVersions API', () => {
    // POST /teams/:teamId/weekends/:weekendId/setupVersions
    describe('POST /teams/:teamId/weekends/:weekendId/setupVersions', () => {

        // Happy Path
        test('Happy Path: 201 when valid during practice with no permission', async () => {

            const { team, weekend } = await createTeamWeekend(app)

            const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                .send(basePayload())

            // Happy Path
            expect(res.statusCode).toBe(201)
            // expect(res.text).toBe("{\"error\":{\"code\":\"NOT_FOUND\",\"message\":\"Team not found\"}}")

        })

        // Contract Test “What exactly does this endpoint promise to return?” 
        test('Contract Test: Happy Path returns the correct body and in JSON', async () => {

            // response is JSON
            // response contains required keys with correct types

            const { team, weekend } = await createTeamWeekend(app)
            const parameters = baseParameters()
            const createdBy = 'Jack Brierly'
            const createdByRole = ROLES.ENGINEER

            const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                .send(basePayload({ parameters, createdBy, createdByRole }))

            expect(res.body).toEqual(expect.objectContaining({
                id: 1,
                teamId: team.body.id,
                weekendId: weekend.body.id,
                changeRequestId: null,
                versionNumber: 1,
                stage: WORKFLOW_STAGES.PRACTICE,
                segment: PRACTICE_SEGMENTS.NULL,
                state: STATES.MUTABLE,
                parameters,
                createdBy,
                createdByRole,
                createdAt: expect.any(String),
            }))

            expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))

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

                const { weekend } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams//weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload())

                expect(res.statusCode).toBe(404)


            })

            test('teamId as a string returns 400', async () => {

                const { weekend } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/one/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload())

                expect(res.statusCode).toBe(400)


            })

            test('teamId as a float returns 400', async () => {

                const { weekend } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/${1.11242}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload())

                expect(res.statusCode).toBe(400)


            })

            test('teamId as a boolean returns 400', async () => {

                const { weekend } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/${true}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload())

                expect(res.statusCode).toBe(400)
            })

            test('teamId <= 0 returns 400', async () => {

                const { weekend } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/${0}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload())

                expect(res.statusCode).toBe(400)
            })

            test('weekendId missing returns 404', async () => {

                const { team } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/${team.body.id}/weekends//setupVersions`)
                    .send(basePayload())

                expect(res.statusCode).toBe(404)


            })
            test('weekendId as a string returns 400', async () => {

                const { team } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/one/setupVersions`)
                    .send(basePayload())

                expect(res.statusCode).toBe(400)


            })

            test('weekendId as a float returns 400', async () => {

                const { team } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${1.3}/setupVersions`)
                    .send(basePayload())

                expect(res.statusCode).toBe(400)


            })

            test('weekendId as a boolean returns 400', async () => {

                const { weekend } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/${weekend.body.id}/weekends/${true}/setupVersions`)
                    .send(basePayload())

                expect(res.statusCode).toBe(400)
            })

            test('weekendId <= 0 returns 400', async () => {

                const { team } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${-1}/setupVersions`)
                    .send(basePayload())

                expect(res.statusCode).toBe(400)
            })

            /**
             * Body params:
             * changeRequestId: missing | not an integer (string, float, boolean) - <= 0
             * parameters: missing | null | array | not object
             * createdBy: missing | not string | whitespace
             * createdByRole: missing | not string | invalid enum
             */


            // changeRequestId: not an integer (string, float, boolean) - <= 0
            test('changeRequestId missing returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const payload = basePayload()
                delete payload.changeRequestId

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })
            test('changeRequestId as a string returns 400', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({ changeRequestId: "1" }))

                expect(res.statusCode).toBe(400)
            })
            test('changeRequestId as a float returns 400', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({ changeRequestId: 1.2 }))

                expect(res.statusCode).toBe(400)
            })
            test('changeRequestId as a boolean returns 400', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({ changeRequestId: true }))

                expect(res.statusCode).toBe(400)
            })
            test('changeRequestId <= 0 returns 400', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({ changeRequestId: 0 }))

                expect(res.statusCode).toBe(400)
            })

            // parameters: missing | null | array | not object
            test('parameters missing returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const payload = basePayload()
                delete payload.parameters

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })
            test('parameters as null returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({ parameters: null }))

                expect(res.statusCode).toBe(400)
            })
            test('parameters as array returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({ parameters: [] }))

                expect(res.statusCode).toBe(400)
            })
            test('parameters as not an object returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({ parameters: "not object" }))

                expect(res.statusCode).toBe(400)
            })

            // createdBy: missing | not string | whitespace
            test('createdBy as missing returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const payload = basePayload()
                delete payload.createdBy

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })
            test('createdBy as an int returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({ createdBy: 12 }))

                expect(res.statusCode).toBe(400)
            })
            test('createdBy as a bool returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({ createdBy: true }))

                expect(res.statusCode).toBe(400)
            })
            test('createdBy as null returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({ createdBy: null }))

                expect(res.statusCode).toBe(400)
            })
            test('createdBy as whitespace returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({ createdBy: " " }))

                expect(res.statusCode).toBe(400)
            })

            // createdByRole: missing | not string | invalid enum
            test('createdByRole as missing returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const payload = basePayload()
                delete payload.createdByRole

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })
            test('createdByRole as an int returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({ createdByRole: 12 }))

                expect(res.statusCode).toBe(400)
            })
            test('createdByRole as a bool returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({ createdByRole: true }))

                expect(res.statusCode).toBe(400)
            })
            test('createdByRole as null returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({ createdByRole: null }))

                expect(res.statusCode).toBe(400)
            })
            test('createdByRole as invalid enum returns 400', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                // this should be an error as we only read it as uppercase
                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({ createdByRole: "engineer" }))

                expect(res.statusCode).toBe(400)
            })
        })

        describe('Existence Tests: endpoint called correctly, but the thing referenced does not exist.', () => {

            test('team does not exist returns 404', async () => {
                const { weekend } = await createTeamWeekend(app)

                const res = await request(app)
                    .post(`/teams/${2}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload())

                expect(res.statusCode).toBe(404)
            })
            test('weekend does not exist returns 404', async () => {
                const { team } = await createTeamWeekend(app)

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${2}/setupVersions`)
                    .send(basePayload())

                expect(res.statusCode).toBe(404)
            })

            test('changeRequestId does not exist returns 404', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({ changeRequestId: 1 }))

                expect(res.statusCode).toBe(404)
            })

        })

        describe('Business rule tests: ways it can be valid input but still not allowed', () => {
            test('create setup version without changeRequestId during qualifying returns 409', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await transitionWeekend(app, team.body.id, weekend.body.id, {
                    toStage: WORKFLOW_STAGES.PRACTICE,
                    toSegment: PRACTICE_SEGMENTS.P1,
                })
                await transitionWeekend(app, team.body.id, weekend.body.id, {
                    toStage: WORKFLOW_STAGES.PRACTICE,
                    toSegment: PRACTICE_SEGMENTS.P2,
                })
                await transitionWeekend(app, team.body.id, weekend.body.id, {
                    toStage: WORKFLOW_STAGES.PRACTICE,
                    toSegment: PRACTICE_SEGMENTS.P3,
                })
                await transitionWeekend(app, team.body.id, weekend.body.id, {
                    toStage: WORKFLOW_STAGES.QUALIFYING,
                    toSegment: QUALIFYING_SEGMENTS.NULL,
                })

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({}))

                console.log("over here!")
                console.log(res.text)

                expect(res.statusCode).toBe(409)
            })
            test('409 when creating setup during race', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)
                
                await transitionWeekend(app, team.body.id, weekend.body.id, {
                    toStage: WORKFLOW_STAGES.QUALIFYING,
                    toSegment: QUALIFYING_SEGMENTS.Q2,
                })
                await transitionWeekend(app, team.body.id, weekend.body.id, {
                    toStage: WORKFLOW_STAGES.QUALIFYING,
                    toSegment: QUALIFYING_SEGMENTS.Q3,
                })
                await transitionWeekend(app, team.body.id, weekend.body.id, {
                    toStage: WORKFLOW_STAGES.RACE,
                    toSegment: null,
                })

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
                    .send(basePayload({}))

                expect(res.statusCode).toBe(409)
            })

        })


    })


})
