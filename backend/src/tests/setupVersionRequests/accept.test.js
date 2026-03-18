const request = require('supertest')
const app = require('../../app')
const { resetTeams } = require('../../models/teams.model')
const { resetWeekends } = require('../../models/weekends.model')
const { resetAudit } = require('../../data/audit.data')
const { resetSetupVersions } = require('../../models/setupVersions.model')
const { ROLES } = require('../../constants/roles')
const { resetSetupVersionsRequests } = require('../../models/setupVersionsRequests.model')
const {
    createTeamWeekend,
    baseParameters,
    advanceP1ToQ1,
    advanceQ1ToReview,
} = require('../helpers/api')

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

beforeEach(() => {
    resetTeams()
    resetWeekends()
    resetAudit()
    resetSetupVersions()
    resetSetupVersionsRequests()
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
