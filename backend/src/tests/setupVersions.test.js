const request = require('supertest')
const app = require('../app')
const { resetTeams } = require('../models/teams.model')
const { resetWeekends } = require('../models/weekends.model')
const { resetAudit } = require('../data/audit.data')
const { resetSetupVersions } = require('../models/setupVersions.model')
const { resetSetupVersionsRequests } = require('../models/setupVersionsRequests.model')
const { WORKFLOW_STAGES } = require('../constants/workflow-stages')
const { PRACTICE_SEGMENTS, QUALIFYING_SEGMENTS } = require('../constants/segments')
const { ROLES } = require('../constants/roles')
const {
  createTeamWeekend,
  givenQualifyingWeekend,
  postTransition,
} = require('./helpers/weekends')
const {
  baseParameters,
  postSetupVersion: apiPostSetupVersion,
  listSetupVersions: apiListSetupVersions,
} = require('./helpers/setupVersions')
const {
  postSetupVersionRequest: apiPostSetupVersionRequest,
  postAcceptSetupVersionRequest: apiPostAcceptSetupVersionRequest,
} = require('./helpers/setupVersionsRequests')

function postSetupVersionPayload(overrides = {}) {
  return {
    setupVersionRequestId: null,
    parameters: baseParameters(),
    createdBy: 'Jack Brierly',
    createdByRole: ROLES.ENGINEER,
    ...overrides,
  }
}

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

function postAcceptSetupVersionRequestPayload(overrides = {}) {
  return {
    acceptedBy: 'John Doe',
    acceptedByRole: ROLES.LEAD_ENGINEER,
    ...overrides,
  }
}

async function createSetupVersion(teamId, weekendId, overrides = {}) {
  return apiPostSetupVersion(app, teamId, weekendId, postSetupVersionPayload(overrides))
}

async function getSetupVersions(teamId, weekendId) {
  return apiListSetupVersions(app, teamId, weekendId)
}

async function createSetupVersionRequest(teamId, weekendId, overrides = {}) {
  return apiPostSetupVersionRequest(app, teamId, weekendId, postSetupVersionRequestPayload(overrides))
}

async function acceptSetupVersionRequest(teamId, weekendId, requestId, overrides = {}) {
  return apiPostAcceptSetupVersionRequest(
    app,
    teamId,
    weekendId,
    requestId,
    postAcceptSetupVersionRequestPayload(overrides)
  )
}

async function givenPracticeWeekend() {
  return createTeamWeekend(app)
}

beforeEach(() => {
  resetTeams()
  resetWeekends()
  resetAudit()
  resetSetupVersions()
  resetSetupVersionsRequests()
})

describe('SetupVersions API', () => {
  describe('POST /teams/:teamId/weekends/:weekendId/setupVersions', () => {
    // Happy path and contract tests
    test('returns the created setup version body in JSON', async () => {
      const { team, weekend } = await givenPracticeWeekend()
      const parameters = baseParameters()
      const createdBy = 'Jack Brierly'
      const createdByRole = ROLES.ENGINEER

      const res = await createSetupVersion(team.body.id, weekend.body.id, {
        parameters,
        createdBy,
        createdByRole,
      })

      expect(res.statusCode).toBe(201)
      expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))
      expect(res.body).toEqual(expect.objectContaining({
        id: 1,
        teamId: team.body.id,
        weekendId: weekend.body.id,
        setupVersionRequestId: null,
        versionNumber: 1,
        segment: PRACTICE_SEGMENTS.NULL,
        parameters,
        createdBy,
        createdByRole,
        createdAtStage: WORKFLOW_STAGES.PRACTICE,
        createdAt: expect.any(String),
      }))
    })

    test('returns the created setup version in qualifying when the request is accepted', async () => {
      const { team, weekend } = await givenQualifyingWeekend(app)

      const requestRes = await createSetupVersionRequest(team.body.id, weekend.body.id, {
        requestedTo: 'John Doe',
      })
      await acceptSetupVersionRequest(team.body.id, weekend.body.id, requestRes.body.id)

      const parameters = baseParameters()
      const createdBy = 'Jack Brierly'
      const createdByRole = ROLES.ENGINEER

      const res = await createSetupVersion(team.body.id, weekend.body.id, {
        parameters,
        createdBy,
        createdByRole,
        setupVersionRequestId: requestRes.body.id,
      })

      expect(res.statusCode).toBe(201)
      expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))
      expect(res.body).toEqual(expect.objectContaining({
        id: 1,
        teamId: team.body.id,
        weekendId: weekend.body.id,
        setupVersionRequestId: requestRes.body.id,
        versionNumber: 1,
        segment: QUALIFYING_SEGMENTS.Q1,
        parameters,
        createdBy,
        createdByRole,
        createdAtStage: WORKFLOW_STAGES.QUALIFYING,
        createdAt: expect.any(String),
      }))
    })

    // Invalid path
    describe('invalid path', () => {
      test('teamId missing returns 404', async () => {
        const { weekend } = await givenPracticeWeekend()

        const res = await request(app)
          .post(`/teams//weekends/${weekend.body.id}/setupVersions`)
          .send(postSetupVersionPayload())

        expect(res.statusCode).toBe(404)
      })

      describe('teamId invalid returns 400', () => {
        test.each([
          ['string', 'one'],
          ['float', 1.11242],
          ['boolean', true],
          ['zero', 0],
          ['negative', -1],
        ])('teamId as %s returns 400', async (_, teamId) => {
          const { weekend } = await givenPracticeWeekend()

          const res = await createSetupVersion(teamId, weekend.body.id)

          expect(res.statusCode).toBe(400)
        })
      })

      test('weekendId missing returns 404', async () => {
        const { team } = await givenPracticeWeekend()

        const res = await request(app)
          .post(`/teams/${team.body.id}/weekends//setupVersions`)
          .send(postSetupVersionPayload())

        expect(res.statusCode).toBe(404)
      })

      describe('weekendId invalid returns 400', () => {
        test.each([
          ['string', 'one'],
          ['float', 1.3],
          ['boolean', true],
          ['zero', 0],
          ['negative', -1],
        ])('weekendId as %s returns 400', async (_, weekendId) => {
          const { team } = await givenPracticeWeekend()

          const res = await createSetupVersion(team.body.id, weekendId)

          expect(res.statusCode).toBe(400)
        })
      })
    })

    // Invalid body
    describe('invalid body', () => {
      test('missing request body returns 400', async () => {
        const { team, weekend } = await givenPracticeWeekend()

        const res = await request(app)
          .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)

        expect(res.statusCode).toBe(400)
      })

      test('setupVersionRequestId missing returns 400', async () => {
        const { team, weekend } = await givenPracticeWeekend()
        const payload = postSetupVersionPayload()
        delete payload.setupVersionRequestId

        const res = await request(app)
          .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
          .send(payload)

        expect(res.statusCode).toBe(400)
      })

      describe('setupVersionRequestId invalid returns 400', () => {
        test.each([
          ['string', 'two'],
          ['float', 1.2],
          ['boolean', true],
          ['zero', 0],
          ['negative', -1],
        ])('setupVersionRequestId as %s returns 400', async (_, setupVersionRequestId) => {
          const { team, weekend } = await givenPracticeWeekend()

          const res = await createSetupVersion(team.body.id, weekend.body.id, { setupVersionRequestId })

          expect(res.statusCode).toBe(400)
        })
      })

      test('parameters missing returns 400', async () => {
        const { team, weekend } = await givenPracticeWeekend()
        const payload = postSetupVersionPayload()
        delete payload.parameters

        const res = await request(app)
          .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
          .send(payload)

        expect(res.statusCode).toBe(400)
      })

      describe('parameters invalid returns 400', () => {
        test.each([
          ['null', null],
          ['array', []],
          ['string', 'not object'],
        ])('parameters as %s returns 400', async (_, parameters) => {
          const { team, weekend } = await givenPracticeWeekend()

          const res = await createSetupVersion(team.body.id, weekend.body.id, { parameters })

          expect(res.statusCode).toBe(400)
        })
      })

      test('createdBy missing returns 400', async () => {
        const { team, weekend } = await givenPracticeWeekend()
        const payload = postSetupVersionPayload()
        delete payload.createdBy

        const res = await request(app)
          .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
          .send(payload)

        expect(res.statusCode).toBe(400)
      })

      describe('createdBy invalid returns 400', () => {
        test.each([
          ['number', 12],
          ['boolean', true],
          ['null', null],
          ['whitespace', ' '],
        ])('createdBy as %s returns 400', async (_, createdBy) => {
          const { team, weekend } = await givenPracticeWeekend()

          const res = await createSetupVersion(team.body.id, weekend.body.id, { createdBy })

          expect(res.statusCode).toBe(400)
        })
      })

      test('createdByRole missing returns 400', async () => {
        const { team, weekend } = await givenPracticeWeekend()
        const payload = postSetupVersionPayload()
        delete payload.createdByRole

        const res = await request(app)
          .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/setupVersions`)
          .send(payload)

        expect(res.statusCode).toBe(400)
      })

      describe('createdByRole invalid returns 400', () => {
        test.each([
          ['number', 12],
          ['boolean', true],
          ['null', null],
          ['invalid enum', 'engineer'],
        ])('createdByRole as %s returns 400', async (_, createdByRole) => {
          const { team, weekend } = await givenPracticeWeekend()

          const res = await createSetupVersion(team.body.id, weekend.body.id, { createdByRole })

          expect(res.statusCode).toBe(400)
        })
      })
    })

    // Existing resource checks
    describe('existing resource checks', () => {
      test('team not found returns 404', async () => {
        const { weekend } = await givenPracticeWeekend()

        const res = await createSetupVersion(2, weekend.body.id)

        expect(res.statusCode).toBe(404)
      })

      test('weekend not found returns 404', async () => {
        const { team } = await givenPracticeWeekend()

        const res = await createSetupVersion(team.body.id, 2)

        expect(res.statusCode).toBe(404)
      })

      test('setupVersionRequestId not found returns 404', async () => {
        const { team, weekend } = await givenPracticeWeekend()

        const res = await createSetupVersion(team.body.id, weekend.body.id, { setupVersionRequestId: 2 })

        expect(res.statusCode).toBe(404)
      })
    })

    // Rejected requests
    describe('rejected requests', () => {
      test('unrequested setup version outside practice returns 409', async () => {
        const { team, weekend } = await givenQualifyingWeekend(app)

        const res = await createSetupVersion(team.body.id, weekend.body.id)

        expect(res.statusCode).toBe(409)
      })

      test('requested setup version in review returns 409', async () => {
        const { team, weekend } = await givenQualifyingWeekend(app)
        const requestRes = await createSetupVersionRequest(team.body.id, weekend.body.id, {
          requestedTo: 'John Doe',
        })
        await acceptSetupVersionRequest(team.body.id, weekend.body.id, requestRes.body.id)

        await postTransition(app, team.body.id, weekend.body.id, {
          toStage: WORKFLOW_STAGES.QUALIFYING,
          toSegment: QUALIFYING_SEGMENTS.Q2,
        })
        await postTransition(app, team.body.id, weekend.body.id, {
          toStage: WORKFLOW_STAGES.QUALIFYING,
          toSegment: QUALIFYING_SEGMENTS.Q3,
        })
        await postTransition(app, team.body.id, weekend.body.id, {
          toStage: WORKFLOW_STAGES.RACE,
          toSegment: null,
        })
        await postTransition(app, team.body.id, weekend.body.id, {
          toStage: WORKFLOW_STAGES.REVIEW,
          toSegment: null,
        })

        const res = await createSetupVersion(team.body.id, weekend.body.id, {
          setupVersionRequestId: requestRes.body.id,
        })

        expect(res.statusCode).toBe(409)
      })

      test('requested setup version requires an accepted request', async () => {
        const { team, weekend } = await givenQualifyingWeekend(app)
        const requestRes = await createSetupVersionRequest(team.body.id, weekend.body.id)

        const res = await createSetupVersion(team.body.id, weekend.body.id, {
          setupVersionRequestId: requestRes.body.id,
        })

        expect(res.statusCode).toBe(400)
      })

      test('createdByRole must be ENGINEER', async () => {
        const { team, weekend } = await givenPracticeWeekend()

        const res = await createSetupVersion(team.body.id, weekend.body.id, {
          createdByRole: ROLES.LEAD_ENGINEER,
        })

        expect(res.statusCode).toBe(400)
      })
    })

    // Side effects
    describe('side effects', () => {
      test('versionNumber increments per weekend', async () => {
        const { team, weekend } = await givenPracticeWeekend()

        await createSetupVersion(team.body.id, weekend.body.id)
        await createSetupVersion(team.body.id, weekend.body.id)

        const res = await getSetupVersions(team.body.id, weekend.body.id)

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveLength(2)
        expect(res.body.map((setupVersion) => setupVersion.versionNumber)).toEqual([1, 2])
      })
    })
  })

  describe('GET /teams/:teamId/weekends/:weekendId/setupVersions', () => {
    test('returns [] when no setup versions exist', async () => {
      const { team, weekend } = await givenPracticeWeekend()

      const res = await getSetupVersions(team.body.id, weekend.body.id)

      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual([])
    })

    test('returns created setup versions in JSON', async () => {
      const { team, weekend } = await givenPracticeWeekend()

      await createSetupVersion(team.body.id, weekend.body.id)

      const res = await getSetupVersions(team.body.id, weekend.body.id)

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))
      expect(res.body).toEqual([
        expect.objectContaining({
          teamId: team.body.id,
          weekendId: weekend.body.id,
          versionNumber: 1,
          createdAtStage: WORKFLOW_STAGES.PRACTICE,
        }),
      ])
    })

    // Invalid path
    describe('invalid path', () => {
      describe('teamId invalid returns 400', () => {
        test.each([
          ['string', 'one'],
          ['float', 1.2],
          ['boolean', true],
          ['zero', 0],
          ['negative', -1],
        ])('teamId as %s returns 400', async (_, teamId) => {
          const res = await getSetupVersions(teamId, 1)

          expect(res.statusCode).toBe(400)
        })
      })

      describe('weekendId invalid returns 400', () => {
        test.each([
          ['string', 'one'],
          ['float', 1.2],
          ['boolean', true],
          ['zero', 0],
          ['negative', -1],
        ])('weekendId as %s returns 400', async (_, weekendId) => {
          const { team } = await givenPracticeWeekend()

          const res = await getSetupVersions(team.body.id, weekendId)

          expect(res.statusCode).toBe(400)
        })
      })
    })

    // Existing resource checks
    describe('existing resource checks', () => {
      test('team not found returns 404', async () => {
        const res = await getSetupVersions(999, 1)

        expect(res.statusCode).toBe(404)
      })

      test('weekend not found returns 404', async () => {
        const { team } = await givenPracticeWeekend()

        const res = await getSetupVersions(team.body.id, 999)

        expect(res.statusCode).toBe(404)
      })
    })
  })
})
