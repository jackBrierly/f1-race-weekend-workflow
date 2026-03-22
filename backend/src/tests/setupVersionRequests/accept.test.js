const request = require('supertest')
const app = require('../../app')
const { resetTeams } = require('../../models/teams.model')
const { resetWeekends } = require('../../models/weekends.model')
const { resetAudit } = require('../../data/audit.data')
const { resetSetupVersions } = require('../../models/setupVersions.model')
const { resetSetupVersionsRequests } = require('../../models/setupVersionsRequests.model')
const { ROLES } = require('../../constants/roles')
const {
  givenQualifyingWeekend,
  advanceQ1ToReview,
} = require('../helpers/weekends')
const { baseParameters } = require('../helpers/setupVersions')
const {
  postSetupVersionRequest: apiPostSetupVersionRequest,
  postAcceptSetupVersionRequest: apiPostAcceptSetupVersionRequest,
} = require('../helpers/setupVersionsRequests')

function postSetupVersionRequestPayload(overrides = {}) {
  return {
    parameters: baseParameters(),
    requestedBy: 'Jack Brierly',
    requestedByRole: ROLES.ENGINEER,
    requestedTo: 'John Parker',
    requestedToRole: ROLES.LEAD_ENGINEER,
    ...overrides,
  }
}

function postAcceptPayload(overrides = {}) {
  return {
    acceptedBy: 'John Parker',
    acceptedByRole: ROLES.LEAD_ENGINEER,
    ...overrides,
  }
}

async function postSetupVersionRequest(teamId, weekendId, overrides = {}) {
  return apiPostSetupVersionRequest(app, teamId, weekendId, postSetupVersionRequestPayload(overrides))
}

async function postAcceptSetupVersionRequest(teamId, weekendId, requestId, overrides = {}) {
  return apiPostAcceptSetupVersionRequest(app, teamId, weekendId, requestId, postAcceptPayload(overrides))
}

beforeEach(() => {
  resetTeams()
  resetWeekends()
  resetAudit()
  resetSetupVersions()
  resetSetupVersionsRequests()
})

describe('POST /teams/:teamId/weekends/:weekendId/setupVersionsRequests/:setupVersionRequestId/accept', () => {
  // Happy path and contract tests
  test('returns the accepted setup version request body in JSON', async () => {
    const { team, weekend } = await givenQualifyingWeekend(app)
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

    const res = await postAcceptSetupVersionRequest(team.body.id, weekend.body.id, createRes.body.id, {
      acceptedBy: requestedTo,
      acceptedByRole: requestedToRole,
    })

    expect(res.statusCode).toBe(201)
    expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))
    expect(res.body).toEqual(expect.objectContaining({
      id: createRes.body.id,
      teamId: team.body.id,
      weekendId: weekend.body.id,
      requestedBy,
      requestedByRole,
      requestedTo,
      requestedToRole,
      parameters,
      requestedAt: expect.any(String),
      status: 'ACCEPTED',
    }))
  })

  // Invalid path
  describe('invalid path', () => {
    test('teamId missing returns 404', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

      const res = await request(app)
        .post(`/teams//weekends/${weekend.body.id}/setupVersionsRequests/${createRes.body.id}/accept`)
        .send(postAcceptPayload())

      expect(res.statusCode).toBe(404)
    })

    describe('teamId invalid returns 400', () => {
      test.each([
        ['string', 'one'],
        ['float', 1.1],
        ['boolean', true],
        ['zero', 0],
        ['negative', -1],
      ])('teamId as %s returns 400', async (_, teamId) => {
        const { team, weekend } = await givenQualifyingWeekend(app)
        const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

        const res = await postAcceptSetupVersionRequest(teamId, weekend.body.id, createRes.body.id)

        expect(res.statusCode).toBe(400)
      })
    })

    test('weekendId missing returns 404', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

      const res = await request(app)
        .post(`/teams/${team.body.id}/weekends//setupVersionsRequests/${createRes.body.id}/accept`)
        .send(postAcceptPayload())

      expect(res.statusCode).toBe(404)
    })

    describe('weekendId invalid returns 400', () => {
      test.each([
        ['string', 'one'],
        ['float', 0.43],
        ['boolean', false],
        ['zero', 0],
        ['negative', -1],
      ])('weekendId as %s returns 400', async (_, weekendId) => {
        const { team, weekend } = await givenQualifyingWeekend(app)
        const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

        const res = await postAcceptSetupVersionRequest(team.body.id, weekendId, createRes.body.id)

        expect(res.statusCode).toBe(400)
      })
    })

    test('setupVersionRequestId missing returns 404', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)

      await postSetupVersionRequest(team.body.id, weekend.body.id)

      const res = await request(app)
        .post(`/teams/${team.body.id}/weekends//setupVersionsRequests//accept`)
        .send(postAcceptPayload())

      expect(res.statusCode).toBe(404)
    })

    describe('setupVersionRequestId invalid returns 400', () => {
      test.each([
        ['string', 'one'],
        ['float', 1.3],
        ['boolean', true],
        ['zero', 0],
        ['negative', -1],
      ])('setupVersionRequestId as %s returns 400', async (_, setupVersionRequestId) => {
        const { team, weekend } = await givenQualifyingWeekend(app)
        await postSetupVersionRequest(team.body.id, weekend.body.id)

        const res = await postAcceptSetupVersionRequest(team.body.id, weekend.body.id, setupVersionRequestId)

        expect(res.statusCode).toBe(400)
      })
    })
  })

  // Invalid body
  describe('invalid body', () => {
    test('missing request body returns 400', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

      const res = await request(app)
        .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests/${createRes.body.id}/accept`)

      expect(res.statusCode).toBe(400)
    })

    test('acceptedBy missing returns 400', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
      const payload = postAcceptPayload()
      delete payload.acceptedBy

      const res = await request(app)
        .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests/${createRes.body.id}/accept`)
        .send(payload)

      expect(res.statusCode).toBe(400)
    })

    describe('acceptedBy invalid returns 400', () => {
      test.each([
        ['number', 1],
        ['boolean', true],
        ['null', null],
        ['whitespace', ' '],
      ])('acceptedBy as %s returns 400', async (_, acceptedBy) => {
        const { team, weekend } = await givenQualifyingWeekend(app)
        const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

        const res = await postAcceptSetupVersionRequest(team.body.id, weekend.body.id, createRes.body.id, { acceptedBy })

        expect(res.statusCode).toBe(400)
      })
    })

    test('acceptedByRole missing returns 400', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
      const payload = postAcceptPayload()
      delete payload.acceptedByRole

      const res = await request(app)
        .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests/${createRes.body.id}/accept`)
        .send(payload)

      expect(res.statusCode).toBe(400)
    })

    describe('acceptedByRole invalid returns 400', () => {
      test.each([
        ['number', 1],
        ['boolean', false],
        ['null', null],
        ['invalid enum', 'lead engineer'],
      ])('acceptedByRole as %s returns 400', async (_, acceptedByRole) => {
        const { team, weekend } = await givenQualifyingWeekend(app)
        const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

        const res = await postAcceptSetupVersionRequest(team.body.id, weekend.body.id, createRes.body.id, { acceptedByRole })

        expect(res.statusCode).toBe(400)
      })
    })
  })

  // Existing resource checks
  describe('existing resource checks', () => {
    test('team not found returns 404', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

      const res = await postAcceptSetupVersionRequest(2, weekend.body.id, createRes.body.id)

      expect(res.statusCode).toBe(404)
    })

    test('weekend not found returns 404', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

      const res = await postAcceptSetupVersionRequest(team.body.id, 2, createRes.body.id)

      expect(res.statusCode).toBe(404)
    })

    test('setupVersionRequest not found returns 404', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)

      await postSetupVersionRequest(team.body.id, weekend.body.id)

      const res = await postAcceptSetupVersionRequest(team.body.id, weekend.body.id, 2)

      expect(res.statusCode).toBe(404)
    })
  })

  // Rejected requests
  describe('rejected requests', () => {
    test('accepting a request during review returns 409', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

      await advanceQ1ToReview(app, team.body.id, weekend.body.id)

      const res = await postAcceptSetupVersionRequest(team.body.id, weekend.body.id, createRes.body.id)

      expect(res.statusCode).toBe(409)
    })

    test('acceptedByRole must be LEAD_ENGINEER', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

      const res = await postAcceptSetupVersionRequest(team.body.id, weekend.body.id, createRes.body.id, {
        acceptedByRole: ROLES.ENGINEER,
      })

      expect(res.statusCode).toBe(400)
    })

    test('acceptedBy must equal requestedTo', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id, { requestedTo: 'Jack' })

      const res = await postAcceptSetupVersionRequest(team.body.id, weekend.body.id, createRes.body.id, {
        acceptedBy: 'Will',
      })

      expect(res.statusCode).toBe(400)
    })

    test('request must still be pending', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

      await postAcceptSetupVersionRequest(team.body.id, weekend.body.id, createRes.body.id)

      const res = await postAcceptSetupVersionRequest(team.body.id, weekend.body.id, createRes.body.id)

      expect(res.statusCode).toBe(400)
    })
  })
})
