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
  postDeclineSetupVersionRequest: apiPostDeclineSetupVersionRequest,
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

function postDeclinePayload(overrides = {}) {
  return {
    declinedBy: 'John Parker',
    declinedByRole: ROLES.LEAD_ENGINEER,
    ...overrides,
  }
}

async function postSetupVersionRequest(teamId, weekendId, overrides = {}) {
  return apiPostSetupVersionRequest(app, teamId, weekendId, postSetupVersionRequestPayload(overrides))
}

async function postDeclineSetupVersionRequest(teamId, weekendId, requestId, overrides = {}) {
  return apiPostDeclineSetupVersionRequest(app, teamId, weekendId, requestId, postDeclinePayload(overrides))
}

beforeEach(() => {
  resetTeams()
  resetWeekends()
  resetAudit()
  resetSetupVersions()
  resetSetupVersionsRequests()
})

describe('POST /teams/:teamId/weekends/:weekendId/setupVersionsRequests/:setupVersionRequestId/decline', () => {
  // Happy path and contract tests
  test('returns the declined setup version request body in JSON', async () => {
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

    const res = await postDeclineSetupVersionRequest(team.body.id, weekend.body.id, createRes.body.id, {
      declinedBy: requestedTo,
      declinedByRole: requestedToRole,
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
      status: 'DECLINED',
    }))
  })

  test('declining during review is allowed', async () => {
    const { team, weekend } = await givenQualifyingWeekend(app)
    const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

    await advanceQ1ToReview(app, team.body.id, weekend.body.id)

    const res = await postDeclineSetupVersionRequest(team.body.id, weekend.body.id, createRes.body.id)

    expect(res.statusCode).toBe(201)
    expect(res.body.status).toBe('DECLINED')
  })

  // Invalid path
  describe('invalid path', () => {
    test('teamId missing returns 404', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

      const res = await request(app)
        .post(`/teams//weekends/${weekend.body.id}/setupVersionsRequests/${createRes.body.id}/decline`)
        .send(postDeclinePayload())

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

        const res = await postDeclineSetupVersionRequest(teamId, weekend.body.id, createRes.body.id)

        expect(res.statusCode).toBe(400)
      })
    })

    test('weekendId missing returns 404', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

      const res = await request(app)
        .post(`/teams/${team.body.id}/weekends//setupVersionsRequests/${createRes.body.id}/decline`)
        .send(postDeclinePayload())

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

        const res = await postDeclineSetupVersionRequest(team.body.id, weekendId, createRes.body.id)

        expect(res.statusCode).toBe(400)
      })
    })

    test('setupVersionRequestId missing returns 404', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)

      await postSetupVersionRequest(team.body.id, weekend.body.id)

      const res = await request(app)
        .post(`/teams/${team.body.id}/weekends//setupVersionsRequests//decline`)
        .send(postDeclinePayload())

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

        const res = await postDeclineSetupVersionRequest(team.body.id, weekend.body.id, setupVersionRequestId)

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
        .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests/${createRes.body.id}/decline`)

      expect(res.statusCode).toBe(400)
    })

    test('declinedBy missing returns 400', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
      const payload = postDeclinePayload()
      delete payload.declinedBy

      const res = await request(app)
        .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests/${createRes.body.id}/decline`)
        .send(payload)

      expect(res.statusCode).toBe(400)
    })

    describe('declinedBy invalid returns 400', () => {
      test.each([
        ['number', 1],
        ['boolean', true],
        ['null', null],
        ['whitespace', ' '],
      ])('declinedBy as %s returns 400', async (_, declinedBy) => {
        const { team, weekend } = await givenQualifyingWeekend(app)
        const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

        const res = await postDeclineSetupVersionRequest(team.body.id, weekend.body.id, createRes.body.id, { declinedBy })

        expect(res.statusCode).toBe(400)
      })
    })

    test('declinedByRole missing returns 400', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)
      const payload = postDeclinePayload()
      delete payload.declinedByRole

      const res = await request(app)
        .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests/${createRes.body.id}/decline`)
        .send(payload)

      expect(res.statusCode).toBe(400)
    })

    describe('declinedByRole invalid returns 400', () => {
      test.each([
        ['number', 1],
        ['boolean', false],
        ['null', null],
        ['invalid enum', 'lead engineer'],
      ])('declinedByRole as %s returns 400', async (_, declinedByRole) => {
        const { team, weekend } = await givenQualifyingWeekend(app)
        const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

        const res = await postDeclineSetupVersionRequest(team.body.id, weekend.body.id, createRes.body.id, { declinedByRole })

        expect(res.statusCode).toBe(400)
      })
    })
  })

  // Existing resource checks
  describe('existing resource checks', () => {
    test('team not found returns 404', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

      const res = await postDeclineSetupVersionRequest(2, weekend.body.id, createRes.body.id)

      expect(res.statusCode).toBe(404)
    })

    test('weekend not found returns 404', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

      const res = await postDeclineSetupVersionRequest(team.body.id, 2, createRes.body.id)

      expect(res.statusCode).toBe(404)
    })

    test('setupVersionRequest not found returns 404', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)

      await postSetupVersionRequest(team.body.id, weekend.body.id)

      const res = await postDeclineSetupVersionRequest(team.body.id, weekend.body.id, 2)

      expect(res.statusCode).toBe(404)
    })
  })

  // Rejected requests
  describe('rejected requests', () => {
    test('declinedByRole must be LEAD_ENGINEER', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

      const res = await postDeclineSetupVersionRequest(team.body.id, weekend.body.id, createRes.body.id, {
        declinedByRole: 'ENGINEER',
      })

      expect(res.statusCode).toBe(400)
    })

    test('declinedBy must equal requestedTo', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id, { requestedTo: 'Jack' })

      const res = await postDeclineSetupVersionRequest(team.body.id, weekend.body.id, createRes.body.id, {
        declinedBy: 'Will',
      })

      expect(res.statusCode).toBe(400)
    })

    test('request must still be pending', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const createRes = await postSetupVersionRequest(team.body.id, weekend.body.id)

      await postDeclineSetupVersionRequest(team.body.id, weekend.body.id, createRes.body.id)

      const res = await postDeclineSetupVersionRequest(team.body.id, weekend.body.id, createRes.body.id)

      expect(res.statusCode).toBe(400)
    })
  })
})
