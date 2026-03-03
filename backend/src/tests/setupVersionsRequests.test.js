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
const { resetSetupVersionsRequests } = require('../models/setupVersionsRequests.model')
const {
    createTeamWeekend,
    baseParameters,
    advanceP1ToQ1,
    advanceQ1ToReview,
    advanceP1ToReview,
} = require('./helpers/api')

// ---------- payload builders ----------
function requestPayload(overrides = {}) {
    return {
        parameters: baseParameters(),
        requestedBy: 'Jack Brierly',
        requestedByRole: ROLES.ENGINEER,
        requestedTo: 'John Parker',
        requestedToRole: ROLES.LEAD_ENGINEER,
        ...overrides,
    }
}

function acceptPayload(overrides = {}) {
    return {
        acceptedBy: 'John Parker',
        acceptedByRole: ROLES.LEAD_ENGINEER,
        ...overrides,
    }
}

function declinePayload(overrides = {}) {
    return {
        declinedBy: 'John Parker',
        declinedByRole: ROLES.LEAD_ENGINEER,
        ...overrides,
    }
}

async function givenQualifyingWeekend() {
    const { team, weekend } = await createTeamWeekend(app)
    await advanceP1ToQ1(app, team.body.id, weekend.body.id)
    return { team, weekend }
}

async function postSetupVersionRequest(teamId, weekendId, overrides = {}) {
    return request(app)
        .post(`/teams/${teamId}/weekends/${weekendId}/setupVersionsRequests`)
        .send(requestPayload(overrides))
}

async function acceptSetupVersionRequest(teamId, weekendId, requestId, overrides = {}) {
    return request(app)
        .post(`/teams/${teamId}/weekends/${weekendId}/setupVersionsRequests/${requestId}/accept`)
        .send(acceptPayload(overrides))
}

async function declineSetupVersionRequest(teamId, weekendId, requestId, overrides = {}) {
    return request(app)
        .post(`/teams/${teamId}/weekends/${weekendId}/setupVersionsRequests/${requestId}/decline`)
        .send(declinePayload(overrides))
}

beforeEach(() => {
    resetTeams()
    resetWeekends()
    resetAudit()
    resetSetupVersions()
    resetSetupVersionsRequests()
})

describe('SetupVersionsRequests API', () => {
    describe('POST /teams/:teamId/weekends/:weekendId/setupVersionsRequests', () => {

        // Happy Path
        test('Happy Path: 201 when valid request is made', async () => {
            const { team, weekend } = await givenQualifyingWeekend()

            const res = await postSetupVersionRequest(team.body.id, weekend.body.id)

            expect(res.statusCode).toBe(201)

        })

        test('Contract Test: Happy Path returns the correct body and in JSON', async () => {
            const { team, weekend } = await givenQualifyingWeekend()

            const res = await postSetupVersionRequest(team.body.id, weekend.body.id)

            const expectedPayload = requestPayload()

            expect(res.body).toEqual(expect.objectContaining({
                id: 1,
                teamId: team.body.id,
                weekendId: weekend.body.id,
                requestedAt: expect.any(String),
                status: 'PENDING',
                ...expectedPayload
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

            /**
             * test.each runs the same test multiple times using different inputs.
             * 
             * Each inner array represents one test case.
             * For example:
             *   ['string', 'one']
             * means:
             *   - first value ('string') is used for naming/readability
             *   - second value ('one') is passed into the test function
             * 
             * '%s' is a placeholder that gets replaced with the first element
             * of each test case when Jest prints the test name.
             * 
             * In this pattern:
             *   async (_, teamId) => { ... }
             * the first value is ignored (using `_`) and only the actual test value
             * (teamId) is used.
             * 
             * The first element exists purely to make test output readable.
            */

            describe('teamId invalid returns 400', () => {
                test.each([
                    ['string', 'one'],
                    ['float', 1.1],
                    ['bool', true],
                    ['zero', 0],
                    ['negative', -1],
                ])('teamId as %s returns 400', async (_, teamId) => {
                    const { weekend } = await givenQualifyingWeekend()
                    const res = await postSetupVersionRequest(teamId, weekend.body.id)
                    expect(res.statusCode).toBe(400)
                })
            })

            test('teamId missing returns 404', async () => {
                const { weekend } = await givenQualifyingWeekend()

                const res = await request(app).post(`/teams//weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(requestPayload())

                expect(res.statusCode).toBe(404)
            })

            describe('weekendId invalid returns 400', () => {
                test.each([
                    ['string', 'one'],
                    ['float', 1.1],
                    ['bool', true],
                    ['zero', 0],
                    ['negative', -1],
                ])('weekendId as %s returns 400', async (_, weekendId) => {
                    const { team } = await givenQualifyingWeekend()
                    const res = await postSetupVersionRequest(team.body.id, weekendId)
                    expect(res.statusCode).toBe(400)
                })
            })

            test('weekendId missing returns 404', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends//setupVersionsRequests`)
                    .send(requestPayload())

                expect(res.statusCode).toBe(404)

            })


            /**
             * Body params:
             * parameters: missing | null | array | not object
             * requestedBy: missing | not string | whitespace
             * requestedByRole: missing | not string | invalid enum
             */

            describe('parameters invalid returns 400', () => {
                test.each([
                    ['null', null],
                    ['array', []],
                    ['not object', 'not object'],
                ])('parameters as %s returns 400', async (_, parameters) => {
                    const { team, weekend } = await givenQualifyingWeekend()

                    const res = await postSetupVersionRequest(team.body.id, weekend.body.id, { parameters })

                    expect(res.statusCode).toBe(400)
                })
            })

            // parameters: missing | null | array | not object
            test('parameters missing returns 400', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const payload = requestPayload()
                delete payload.parameters

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })

            // requestedBy: missing | not string | whitespace
            describe('requestedBy invalid returns 400', () => {
                test.each([
                    ['int', 1],
                    ['bool', true],
                    ['null', null],
                    ['whitespace', ' '],
                ])('requestedBy as %s returns 400', async (_, requestedBy) => {
                    const { team, weekend } = await givenQualifyingWeekend()

                    const res = await postSetupVersionRequest(
                        team.body.id,
                        weekend.body.id,
                        { requestedBy }
                    )

                    expect(res.statusCode).toBe(400)
                })
            })
            test('requestedBy as missing returns 400', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const payload = requestPayload()
                delete payload.requestedBy

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })

            describe('requestedTo invalid returns 400', () => {
                test.each([
                    ['int', 1],
                    ['bool', true],
                    ['null', null],
                    ['whitespace', ' '],
                ])('requestedTo as %s returns 400', async (_, requestedTo) => {
                    const { team, weekend } = await givenQualifyingWeekend()

                    const res = await postSetupVersionRequest(team.body.id, weekend.body.id, { requestedTo })

                    expect(res.statusCode).toBe(400)
                })
            })

            // requestedBy: missing | not string | whitespace
            test('requestedTo as missing returns 400', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const payload = requestPayload()
                delete payload.requestedTo

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })


            // createdByRole: missing | not string | invalid enum
            describe('requestedToRole invalid returns 400', () => {
                test.each([
                    ['int', 1],
                    ['null', null],
                    ['bool', true],
                    ['invalid enum', 'engineer'],
                ])('requestedTo as %s returns 400', async (_, requestedToRole) => {
                    const { team, weekend } = await givenQualifyingWeekend()

                    const res = await postSetupVersionRequest(team.body.id, weekend.body.id, { requestedToRole })

                    expect(res.statusCode).toBe(400)
                })
            })
            test('requestedToRole as missing returns 400', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const payload = requestPayload()
                delete payload.requestedToRole

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })

            // rquestedByRole: missing | not string | invalid enum
            describe('requestedByRole invalid returns 400', () => {
                test.each([
                    ['int', 1],
                    ['null', null],
                    ['bool', true],
                    ['invalid enum', 'engineer'],
                ])('requestedTo as %s returns 400', async (_, requestedByRole) => {
                    const { team, weekend } = await givenQualifyingWeekend()

                    const res = await postSetupVersionRequest(team.body.id, weekend.body.id, { requestedByRole })

                    expect(res.statusCode).toBe(400)
                })
            })
            test('requestedByRole as missing returns 400', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const payload = requestPayload()
                delete payload.requestedByRole

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })
        })

        describe('Existence Tests: endpoint called correctly, but the thing referenced does not exist.', () => {

            test('team does not exist returns 404', async () => {
                const { weekend } = await givenQualifyingWeekend()

                const res = await postSetupVersionRequest(2, weekend.body.id)

                expect(res.statusCode).toBe(404)
            })
            test('weekend does not exist returns 404', async () => {
                const { team } = await givenQualifyingWeekend()

                const res = await postSetupVersionRequest(team.body.id, 2)

                expect(res.statusCode).toBe(404)
            })
        })

        describe('Business rule tests: ways it can be valid input but still not allowed', () => {
            test('request setup version without during practice returns 409', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(requestPayload())

                expect(res.statusCode).toBe(409)

            })
            test('409 when requesting setup during review', async () => {

                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToReview(app, team.body.id, weekend.body.id)

                const res = await request(app).post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(requestPayload())

                expect(res.statusCode).toBe(409)
            })

            test('400 when requestedByRole is not ENGINEER', async () => {

                const { team, weekend } = await givenQualifyingWeekend()

                const res = await postSetupVersionRequest(team.body.id, weekend.body.id, { requestedByRole: ROLES.LEAD_ENGINEER })

                expect(res.statusCode).toBe(400)
            })
            test('400 when requestedToRole is not LEAD_ENGINEER', async () => {

                const { team, weekend } = await givenQualifyingWeekend()

                const res = await postSetupVersionRequest(team.body.id, weekend.body.id, { requestedToRole: ROLES.ENGINEER })

                expect(res.statusCode).toBe(400)
            })
        })
        describe('Side effects test: did it actually do the thing', () => {
            /**
             * - After creating setupVersion, GET list includes it
             * - versionNumber increments
             */
            test('GET list includes setupVersion after creating it', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                const setupRequest = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(requestPayload())

                const res = await request(app)
                    .get(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)

                expect(res.body).toHaveLength(1)

                expect(res.body[0]).toMatchObject({
                    weekendId: weekend.body.id,
                    teamId: team.body.id,
                    id: setupRequest.body.id
                })
            })

            test('setupVersionRequestId increments per weekend', async () => {
                const { team, weekend } = await createTeamWeekend(app)

                await advanceP1ToQ1(app, team.body.id, weekend.body.id)

                await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(requestPayload())

                await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
                    .send(requestPayload())

                const res = await request(app)
                    .get(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)

                expect(res.statusCode).toBe(200)
                expect(res.body).toHaveLength(2)

                const versionNumbers = res.body.map(v => v.id).sort((a, b) => a - b)
                expect(versionNumbers).toEqual([1, 2])
            })
        })
    })

    describe('POST /teams/:teamId/weekends/:weekendId/setupVersionsRequests/:setupVersionRequestId/accept', () => {
        // Happy Path
        test('Happy Path: 201 when valid accepting request in qualifying', async () => {
            const { team, weekend } = await givenQualifyingWeekend()

            const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
            const requestId = createRes.body.id

            const res = await acceptSetupVersionRequest(team.body.id, weekend.body.id, requestId)

            expect(res.statusCode).toBe(201)
            expect(res.body).toEqual(expect.objectContaining({
                id: requestId,
                status: 'ACCEPTED',
            }))
        })
        test('Contract Test: Happy Path returns the correct body and in JSON', async () => {
            const { team, weekend } = await givenQualifyingWeekend()

            const parameters = baseParameters()
            const requestedBy = 'Jack Brierly'
            const requestedByRole = ROLES.ENGINEER
            const requestedTo = 'John Doe'
            const requestedToRole = ROLES.LEAD_ENGINEER

            const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id, { parameters, requestedBy, requestedByRole, requestedTo, requestedToRole })

            const requestId = createRes.body.id

            const res = await acceptSetupVersionRequest(team.body.id, weekend.body.id, requestId, { acceptedBy: requestedTo, acceptedByRole: requestedToRole })

            expect(res.body).toEqual(expect.objectContaining({
                id: requestId,
                teamId: team.body.id,
                weekendId: weekend.body.id,
                requestedBy,
                requestedByRole,
                requestedTo,
                requestedToRole,
                parameters,
                requestedAt: expect.any(String),
                status: 'ACCEPTED'
            }))
            console.log(res.body)
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
                const { team, weekend } = await givenQualifyingWeekend()

                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                const requestId = createRes.body.id

                const res = await request(app)
                    .post(`/teams//weekends/${weekend.body.id}/setupVersionsRequests/${requestId}/accept`)
                    .send(acceptPayload())

                expect(res.statusCode).toBe(404)
            })

            describe('teamId invalid returns 400', () => {
                test.each([
                    ['string', 'one'],
                    ['float', 1.1],
                    ['bool', true],
                    ['zero', 0],
                    ['negative', -1],
                ])('teamId as %s returns 400', async (_, teamId) => {
                    const { team, weekend } = await givenQualifyingWeekend()
                    const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                    const requestId = createRes.body.id

                    const res = await acceptSetupVersionRequest(teamId, weekend.body.id, requestId)
                    expect(res.statusCode).toBe(400)
                })
            })

            test('weekendId missing returns 404', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                const requestId = createRes.body.id

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends//setupVersionsRequests/${requestId}/accept`)
                    .send(acceptPayload())

                expect(res.statusCode).toBe(404)
            })

            describe('weekendId invalid returns 400', () => {
                test.each([
                    ['string', 'one'],
                    ['float', 0.43],
                    ['bool', false],
                    ['zero', 0],
                    ['negative', -1],
                ])('weekendId as %s returns 400', async (_, weekendId) => {
                    const { team, weekend } = await givenQualifyingWeekend()
                    const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                    const requestId = createRes.body.id

                    const res = await acceptSetupVersionRequest(team.body.id, weekendId, requestId)
                    expect(res.statusCode).toBe(400)
                })
            })

            test('setupVersionRequestId missing returns 404', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                await postSetupVersionRequest(team.body.id, weekend.body.id)

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends//setupVersionsRequests//accept`)
                    .send(acceptPayload())

                expect(res.statusCode).toBe(404)
            })

            describe('setupVersionRequestId invalid returns 400', () => {
                test.each([
                    ['string', 'one'],
                    ['float', 1.3],
                    ['bool', true],
                    ['zero', 0],
                    ['negative', -1],
                ])('setupVersionRequestId as %s returns 400', async (_, setupVersionRequestId) => {
                    const { team, weekend } = await givenQualifyingWeekend()
                    await postSetupVersionRequest(team.body.id, weekend.body.id)

                    const res = await acceptSetupVersionRequest(team.body.id, weekend.body.id, setupVersionRequestId)
                    expect(res.statusCode).toBe(400)
                })
            })

            test('acceptedBy as missing returns 400', async () => {
                const { team, weekend } = await givenQualifyingWeekend()
                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                const requestId = createRes.body.id

                const payload = acceptPayload()
                delete payload.acceptedBy

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests/${requestId}/accept`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })

            describe('acceptedBy invalid returns 400', () => {
                test.each([
                    ['int', 1],
                    ['bool', true],
                    ['null', null],
                    ['whitespace', ' '],
                ])('acceptedBy as %s returns 400', async (_, acceptedBy) => {
                    const { team, weekend } = await givenQualifyingWeekend()
                    const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                    const requestId = createRes.body.id

                    const res = await acceptSetupVersionRequest(team.body.id, weekend.body.id, requestId, { acceptedBy })
                    expect(res.statusCode).toBe(400)
                })
            })

            test('acceptedByRole as missing returns 400', async () => {
                const { team, weekend } = await givenQualifyingWeekend()
                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                const requestId = createRes.body.id

                const payload = acceptPayload()
                delete payload.acceptedByRole

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests/${requestId}/accept`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })

            describe('acceptedByRole invalid returns 400', () => {
                test.each([
                    ['int', 1],
                    ['bool', false],
                    ['null', null],
                    ['invalid enum', 'lead engineer'],
                ])('acceptedByRole as %s returns 400', async (_, acceptedByRole) => {
                    const { team, weekend } = await givenQualifyingWeekend()
                    const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                    const requestId = createRes.body.id

                    const res = await acceptSetupVersionRequest(team.body.id, weekend.body.id, requestId, { acceptedByRole })
                    expect(res.statusCode).toBe(400)
                })
            })
        })
        describe('Existence Tests: endpoint called correctly, but the thing referenced does not exist.', () => {

            test('team does not exist returns 404', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                const requestId = createRes.body.id

                const res = await acceptSetupVersionRequest(2, weekend.body.id, requestId)

                expect(res.statusCode).toBe(404)
            })
            test('weekend does not exist returns 404', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                const requestId = createRes.body.id

                const res = await acceptSetupVersionRequest(team.body.id, 2, requestId)

                expect(res.statusCode).toBe(404)
            })
            test('setupVersionRequest does not exist returns 404', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                await postSetupVersionRequest(team.body.id, weekend.body.id)

                const res = await acceptSetupVersionRequest(team.body.id, weekend.body.id, 2)

                expect(res.statusCode).toBe(404)
            })
        })
        describe('Business rule tests: ways it can be valid input but still not allowed', () => {
            test('accept setup version during review returns 409', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                const requestId = createRes.body.id

                await advanceQ1ToReview(app, team.body.id, weekend.body.id)

                const res = await acceptSetupVersionRequest(team.body.id, weekend.body.id, requestId)

                expect(res.statusCode).toBe(409)

            })

            test('400 when acceptedByRole is not LEAD_ENGINEER', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                const requestId = createRes.body.id

                const res = await acceptSetupVersionRequest(team.body.id, weekend.body.id, requestId, { acceptedByRole: 'ENGINEER' })

                expect(res.statusCode).toBe(400)
            })
            test('400 when acceptedBy is not the same as requestedTo', async () => {

                const { team, weekend } = await givenQualifyingWeekend()

                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id, { requestedTo: "Jack" })
                const requestId = createRes.body.id

                const res = await acceptSetupVersionRequest(team.body.id, weekend.body.id, requestId, { acceptedBy: "Will" })

                expect(res.statusCode).toBe(400)
            })
        })
    })
    describe('POST /teams/:teamId/weekends/:weekendId/setupVersionsRequests/:setupVersionRequestId/decline', () => {
        // Happy Path
        test('Happy Path: 201 when valid declining request in qualifying', async () => {
            const { team, weekend } = await givenQualifyingWeekend()

            const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
            const requestId = createRes.body.id

            const res = await declineSetupVersionRequest(team.body.id, weekend.body.id, requestId)

            expect(res.statusCode).toBe(201)
            expect(res.body).toEqual(expect.objectContaining({
                id: requestId,
                status: 'DECLINED',
            }))
        })

        test('Happy Path: 201 when declining during review (decline allowed at any stage)', async () => {
            const { team, weekend } = await givenQualifyingWeekend()

            const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
            const requestId = createRes.body.id

            await advanceQ1ToReview(app, team.body.id, weekend.body.id)

            const res = await declineSetupVersionRequest(team.body.id, weekend.body.id, requestId)

            expect(res.statusCode).toBe(201)
            expect(res.body).toEqual(expect.objectContaining({
                id: requestId,
                status: 'DECLINED',
            }))
        })

        test('Contract Test: Happy Path returns the correct body and in JSON', async () => {
            const { team, weekend } = await givenQualifyingWeekend()

            const parameters = baseParameters()
            const requestedBy = 'Jack Brierly'
            const requestedByRole = ROLES.ENGINEER
            const requestedTo = 'John Doe'
            const requestedToRole = ROLES.LEAD_ENGINEER

            const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id, {
                parameters,
                requestedBy,
                requestedByRole,
                requestedTo,
                requestedToRole,
            })
            const requestId = createRes.body.id

            const res = await declineSetupVersionRequest(team.body.id, weekend.body.id, requestId, {
                declinedBy: requestedTo,
                declinedByRole: requestedToRole,
            })

            expect(res.body).toEqual(expect.objectContaining({
                id: requestId,
                teamId: team.body.id,
                weekendId: weekend.body.id,
                requestedBy,
                requestedByRole,
                requestedTo,
                requestedToRole,
                parameters,
                requestedAt: expect.any(String),
                status: 'DECLINED',
            }))
        })

        describe('Validation Tests: ways the BODY can be wrong', () => {
            test('teamId missing returns 404', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                const requestId = createRes.body.id

                const res = await request(app)
                    .post(`/teams//weekends/${weekend.body.id}/setupVersionsRequests/${requestId}/decline`)
                    .send(declinePayload())

                expect(res.statusCode).toBe(404)
            })

            describe('teamId invalid returns 400', () => {
                test.each([
                    ['string', 'one'],
                    ['float', 1.1],
                    ['bool', true],
                    ['zero', 0],
                    ['negative', -1],
                ])('teamId as %s returns 400', async (_, teamId) => {
                    const { team, weekend } = await givenQualifyingWeekend()
                    const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                    const requestId = createRes.body.id

                    const res = await declineSetupVersionRequest(teamId, weekend.body.id, requestId)
                    expect(res.statusCode).toBe(400)
                })
            })

            test('weekendId missing returns 404', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                const requestId = createRes.body.id

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends//setupVersionsRequests/${requestId}/decline`)
                    .send(declinePayload())

                expect(res.statusCode).toBe(404)
            })

            describe('weekendId invalid returns 400', () => {
                test.each([
                    ['string', 'one'],
                    ['float', 0.43],
                    ['bool', false],
                    ['zero', 0],
                    ['negative', -1],
                ])('weekendId as %s returns 400', async (_, weekendId) => {
                    const { team, weekend } = await givenQualifyingWeekend()
                    const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                    const requestId = createRes.body.id

                    const res = await declineSetupVersionRequest(team.body.id, weekendId, requestId)
                    expect(res.statusCode).toBe(400)
                })
            })

            test('setupVersionRequestId missing returns 404', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                await postSetupVersionRequest(team.body.id, weekend.body.id)

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends//setupVersionsRequests//decline`)
                    .send(declinePayload())

                expect(res.statusCode).toBe(404)
            })

            describe('setupVersionRequestId invalid returns 400', () => {
                test.each([
                    ['string', 'one'],
                    ['float', 1.3],
                    ['bool', true],
                    ['zero', 0],
                    ['negative', -1],
                ])('setupVersionRequestId as %s returns 400', async (_, setupVersionRequestId) => {
                    const { team, weekend } = await givenQualifyingWeekend()
                    await postSetupVersionRequest(team.body.id, weekend.body.id)

                    const res = await declineSetupVersionRequest(team.body.id, weekend.body.id, setupVersionRequestId)
                    expect(res.statusCode).toBe(400)
                })
            })

            // declinedBy: missing | not string | whitespace
            test('declinedBy as missing returns 400', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                const requestId = createRes.body.id

                const payload = declinePayload()
                delete payload.declinedBy

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests/${requestId}/decline`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })

            describe('declinedBy invalid returns 400', () => {
                test.each([
                    ['int', 1],
                    ['bool', true],
                    ['null', null],
                    ['whitespace', ' '],
                ])('declinedBy as %s returns 400', async (_, declinedBy) => {
                    const { team, weekend } = await givenQualifyingWeekend()
                    const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                    const requestId = createRes.body.id

                    const res = await declineSetupVersionRequest(team.body.id, weekend.body.id, requestId, { declinedBy })
                    expect(res.statusCode).toBe(400)
                })
            })

            // declinedByRole: missing | not string | invalid enum
            test('declinedByRole as missing returns 400', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                const requestId = createRes.body.id

                const payload = declinePayload()
                delete payload.declinedByRole

                const res = await request(app)
                    .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests/${requestId}/decline`)
                    .send(payload)

                expect(res.statusCode).toBe(400)
            })

            describe('declinedByRole invalid returns 400', () => {
                test.each([
                    ['int', 1],
                    ['bool', false],
                    ['null', null],
                    ['invalid enum', 'lead engineer'],
                ])('declinedByRole as %s returns 400', async (_, declinedByRole) => {
                    const { team, weekend } = await givenQualifyingWeekend()
                    const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                    const requestId = createRes.body.id

                    const res = await declineSetupVersionRequest(team.body.id, weekend.body.id, requestId, { declinedByRole })
                    expect(res.statusCode).toBe(400)
                })
            })
        })

        describe('Existence Tests: endpoint called correctly, but the thing referenced does not exist.', () => {
            test('team does not exist returns 404', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                const requestId = createRes.body.id

                const res = await declineSetupVersionRequest(2, weekend.body.id, requestId)

                expect(res.statusCode).toBe(404)
            })

            test('weekend does not exist returns 404', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                const requestId = createRes.body.id

                const res = await declineSetupVersionRequest(team.body.id, 2, requestId)

                expect(res.statusCode).toBe(404)
            })

            test('setupVersionRequest does not exist returns 404', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                await postSetupVersionRequest(team.body.id, weekend.body.id)

                const res = await declineSetupVersionRequest(team.body.id, weekend.body.id, 2)

                expect(res.statusCode).toBe(404)
            })
        })

        describe('Business rule tests: ways it can be valid input but still not allowed', () => {
            test('400 when declinedByRole is not LEAD_ENGINEER', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
                const requestId = createRes.body.id

                const res = await declineSetupVersionRequest(team.body.id, weekend.body.id, requestId, { declinedByRole: 'ENGINEER' })

                expect(res.statusCode).toBe(400)
            })

            test('400 when declinedBy is not the same as requestedTo', async () => {
                const { team, weekend } = await givenQualifyingWeekend()

                const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id, { requestedTo: "Jack" })
                const requestId = createRes.body.id

                const res = await declineSetupVersionRequest(team.body.id, weekend.body.id, requestId, { declinedBy: "Will" })

                expect(res.statusCode).toBe(400)
            })
        })
    })
})

module.exports = { setupVersionsRequestsBasePayload: requestPayload }