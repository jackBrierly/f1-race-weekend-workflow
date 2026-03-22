const request = require('supertest')
const app = require('../../app')
const { resetTeams } = require('../../models/teams.model')
const { resetWeekends } = require('../../models/weekends.model')
const { resetAudit } = require('../../data/audit.data')
const { resetSetupVersions } = require('../../models/setupVersions.model')
const { resetSetupVersionsRequests } = require('../../models/setupVersionsRequests.model')
const { ROLES } = require('../../constants/roles')
const {
  createTeamWeekend,
  givenQualifyingWeekend,
  advanceP1ToReview,
} = require('../helpers/weekends')
const { baseParameters } = require('../helpers/setupVersions')
const {
  postSetupVersionRequest: apiPostSetupVersionRequest,
  listSetupVersionRequests: apiListSetupVersionRequests,
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

async function postSetupVersionRequest(teamId, weekendId, overrides = {}) {
  return apiPostSetupVersionRequest(app, teamId, weekendId, postSetupVersionRequestPayload(overrides))
}

async function listSetupVersionRequests(teamId, weekendId) {
  return apiListSetupVersionRequests(app, teamId, weekendId)
}

beforeEach(() => {
  resetTeams()
  resetWeekends()
  resetAudit()
  resetSetupVersions()
  resetSetupVersionsRequests()
})

describe('POST /teams/:teamId/weekends/:weekendId/setupVersionsRequests', () => {
  // Happy path and contract tests
  test('returns the created setup version request body in JSON', async () => {
    const { team, weekend } = await givenQualifyingWeekend(app)

    const res = await postSetupVersionRequest(team.body.id, weekend.body.id)

    expect(res.statusCode).toBe(201)
    expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))
    expect(res.body).toEqual(expect.objectContaining({
      id: 1,
      teamId: team.body.id,
      weekendId: weekend.body.id,
      requestedAt: expect.any(String),
      status: 'PENDING',
      ...postSetupVersionRequestPayload(),
    }))
  })

  // Invalid path
  describe('invalid path', () => {
    test('teamId missing returns 404', async () => {
      const { weekend } = await givenQualifyingWeekend(app)

      const res = await request(app)
        .post(`/teams//weekends/${weekend.body.id}/setupVersionsRequests`)
        .send(postSetupVersionRequestPayload())

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
        const { weekend } = await givenQualifyingWeekend(app)

        const res = await postSetupVersionRequest(teamId, weekend.body.id)

        expect(res.statusCode).toBe(400)
      })
    })

    test('weekendId missing returns 404', async () => {
      const { team } = await givenQualifyingWeekend(app)

      const res = await request(app)
        .post(`/teams/${team.body.id}/weekends//setupVersionsRequests`)
        .send(postSetupVersionRequestPayload())

      expect(res.statusCode).toBe(404)
    })

    describe('weekendId invalid returns 400', () => {
      test.each([
        ['string', 'one'],
        ['float', 1.1],
        ['boolean', true],
        ['zero', 0],
        ['negative', -1],
      ])('weekendId as %s returns 400', async (_, weekendId) => {
        const { team } = await givenQualifyingWeekend(app)

        const res = await postSetupVersionRequest(team.body.id, weekendId)

        expect(res.statusCode).toBe(400)
      })
    })
  })

  // Invalid body
  describe('invalid body', () => {
    test('missing request body returns 400', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)

      const res = await request(app)
        .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)

      expect(res.statusCode).toBe(400)
    })

    test('parameters missing returns 400', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const payload = postSetupVersionRequestPayload()
      delete payload.parameters

      const res = await request(app)
        .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
        .send(payload)

      expect(res.statusCode).toBe(400)
    })

    describe('parameters invalid returns 400', () => {
      test.each([
        ['null', null],
        ['array', []],
        ['string', 'not object'],
      ])('parameters as %s returns 400', async (_, parameters) => {
        const { team, weekend } = await givenQualifyingWeekend(app)

        const res = await postSetupVersionRequest(team.body.id, weekend.body.id, { parameters })

        expect(res.statusCode).toBe(400)
      })
    })

    test('requestedBy missing returns 400', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const payload = postSetupVersionRequestPayload()
      delete payload.requestedBy

      const res = await request(app)
        .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
        .send(payload)

      expect(res.statusCode).toBe(400)
    })

    describe('requestedBy invalid returns 400', () => {
      test.each([
        ['number', 1],
        ['boolean', true],
        ['null', null],
        ['whitespace', ' '],
      ])('requestedBy as %s returns 400', async (_, requestedBy) => {
        const { team, weekend } = await givenQualifyingWeekend(app)

        const res = await postSetupVersionRequest(team.body.id, weekend.body.id, { requestedBy })

        expect(res.statusCode).toBe(400)
      })
    })

    test('requestedTo missing returns 400', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const payload = postSetupVersionRequestPayload()
      delete payload.requestedTo

      const res = await request(app)
        .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
        .send(payload)

      expect(res.statusCode).toBe(400)
    })

    describe('requestedTo invalid returns 400', () => {
      test.each([
        ['number', 1],
        ['boolean', true],
        ['null', null],
        ['whitespace', ' '],
      ])('requestedTo as %s returns 400', async (_, requestedTo) => {
        const { team, weekend } = await givenQualifyingWeekend(app)

        const res = await postSetupVersionRequest(team.body.id, weekend.body.id, { requestedTo })

        expect(res.statusCode).toBe(400)
      })
    })

    test('requestedToRole missing returns 400', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const payload = postSetupVersionRequestPayload()
      delete payload.requestedToRole

      const res = await request(app)
        .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
        .send(payload)

      expect(res.statusCode).toBe(400)
    })

    describe('requestedToRole invalid returns 400', () => {
      test.each([
        ['number', 1],
        ['null', null],
        ['boolean', true],
        ['invalid enum', 'engineer'],
      ])('requestedToRole as %s returns 400', async (_, requestedToRole) => {
        const { team, weekend } = await givenQualifyingWeekend(app)

        const res = await postSetupVersionRequest(team.body.id, weekend.body.id, { requestedToRole })

        expect(res.statusCode).toBe(400)
      })
    })

    test('requestedByRole missing returns 400', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)
      const payload = postSetupVersionRequestPayload()
      delete payload.requestedByRole

      const res = await request(app)
        .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersionsRequests`)
        .send(payload)

      expect(res.statusCode).toBe(400)
    })

    describe('requestedByRole invalid returns 400', () => {
      test.each([
        ['number', 1],
        ['null', null],
        ['boolean', true],
        ['invalid enum', 'engineer'],
      ])('requestedByRole as %s returns 400', async (_, requestedByRole) => {
        const { team, weekend } = await givenQualifyingWeekend(app)

        const res = await postSetupVersionRequest(team.body.id, weekend.body.id, { requestedByRole })

        expect(res.statusCode).toBe(400)
      })
    })
  })

  // Existing resource checks
  describe('existing resource checks', () => {
    test('team not found returns 404', async () => {
      const { weekend } = await givenQualifyingWeekend(app)

      const res = await postSetupVersionRequest(2, weekend.body.id)

      expect(res.statusCode).toBe(404)
    })

    test('weekend not found returns 404', async () => {
      const { team } = await givenQualifyingWeekend(app)

      const res = await postSetupVersionRequest(team.body.id, 2)

      expect(res.statusCode).toBe(404)
    })
  })

  // Rejected requests
  describe('rejected requests', () => {
    test('requesting a setup version during practice returns 409', async () => {
      const { team, weekend } = await createTeamWeekend(app)

      const res = await postSetupVersionRequest(team.body.id, weekend.body.id)

      expect(res.statusCode).toBe(409)
    })

    test('requesting a setup version during review returns 409', async () => {
      const { team, weekend } = await createTeamWeekend(app)
      await advanceP1ToReview(app, team.body.id, weekend.body.id)

      const res = await postSetupVersionRequest(team.body.id, weekend.body.id)

      expect(res.statusCode).toBe(409)
    })

    test('requestedByRole must be ENGINEER', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)

      const res = await postSetupVersionRequest(team.body.id, weekend.body.id, {
        requestedByRole: ROLES.LEAD_ENGINEER,
      })

      expect(res.statusCode).toBe(400)
    })

    test('requestedToRole must be LEAD_ENGINEER', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)

      const res = await postSetupVersionRequest(team.body.id, weekend.body.id, {
        requestedToRole: ROLES.ENGINEER,
      })

      expect(res.statusCode).toBe(400)
    })
  })
})

describe('GET /teams/:teamId/weekends/:weekendId/setupVersionsRequests', () => {
  test('returns [] when no setup version requests exist', async () => {
    const { team, weekend } = await givenQualifyingWeekend(app)

    const res = await listSetupVersionRequests(team.body.id, weekend.body.id)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([])
  })

  test('returns created setup version requests in JSON', async () => {
    const { team, weekend } = await givenQualifyingWeekend(app)

    await postSetupVersionRequest(team.body.id, weekend.body.id)

    const res = await listSetupVersionRequests(team.body.id, weekend.body.id)

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))
    expect(res.body).toEqual([
      expect.objectContaining({
        id: 1,
        teamId: team.body.id,
        weekendId: weekend.body.id,
        status: 'PENDING',
      }),
    ])
  })

  // Invalid path
  describe('invalid path', () => {
    describe('teamId invalid returns 400', () => {
      test.each([
        ['string', 'one'],
        ['float', 1.1],
        ['boolean', true],
        ['zero', 0],
        ['negative', -1],
      ])('teamId as %s returns 400', async (_, teamId) => {
        const res = await listSetupVersionRequests(teamId, 1)

        expect(res.statusCode).toBe(400)
      })
    })

    describe('weekendId invalid returns 400', () => {
      test.each([
        ['string', 'one'],
        ['float', 1.1],
        ['boolean', true],
        ['zero', 0],
        ['negative', -1],
      ])('weekendId as %s returns 400', async (_, weekendId) => {
        const { team } = await givenQualifyingWeekend(app)

        const res = await listSetupVersionRequests(team.body.id, weekendId)

        expect(res.statusCode).toBe(400)
      })
    })
  })

  // Existing resource checks
  describe('existing resource checks', () => {
    test('team not found returns 404', async () => {
      const res = await listSetupVersionRequests(999, 1)

      expect(res.statusCode).toBe(404)
    })

    test('weekend not found returns 404', async () => {
      const { team } = await givenQualifyingWeekend(app)

      const res = await listSetupVersionRequests(team.body.id, 999)

      expect(res.statusCode).toBe(404)
    })
  })

  // Side effects
  describe('side effects', () => {
    test('setupVersionRequest ids increment per weekend', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)

      await postSetupVersionRequest(team.body.id, weekend.body.id)
      await postSetupVersionRequest(team.body.id, weekend.body.id)

      const res = await listSetupVersionRequests(team.body.id, weekend.body.id)

      expect(res.statusCode).toBe(200)
      expect(res.body.map((setupVersionRequest) => setupVersionRequest.id)).toEqual([1, 2])
    })
  })
})
