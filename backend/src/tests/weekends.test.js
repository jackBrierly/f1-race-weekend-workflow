const request = require('supertest')
const app = require('../app')
const { resetTeams } = require('../models/teams.model')
const { resetWeekends } = require('../models/weekends.model')
const { WORKFLOW_STAGES } = require('../constants/workflow-stages')
const { getAuditForWeekend, resetAudit } = require('../data/audit.data')
const { PRACTICE_SEGMENTS, QUALIFYING_SEGMENTS } = require('../constants/segments')
const { ROLES } = require('../constants/roles')
const { postTeam: apiPostTeam } = require('./helpers/teams')
const {
  postWeekend: apiPostWeekend,
  listWeekends: apiListWeekends,
  getWeekend: apiGetWeekend,
  postTransition: apiPostTransition,
} = require('./helpers/weekends')


function postTeamPayload(overrides = {}) {
  return {
    name: 'McLaren',
    ...overrides,
  }
}

function postWeekendPayload(overrides = {}) {
  return {
    name: 'Australia',
    ...overrides,
  }
}

function postTransitionPayload(overrides = {}) {
  return {
    actorName: 'Alex Engineer',
    actorRole: ROLES.LEAD_ENGINEER,
    toStage: WORKFLOW_STAGES.PRACTICE,
    toSegment: PRACTICE_SEGMENTS.P1,
    ...overrides,
  }
}

async function postTeam(overrides = {}) {
  return apiPostTeam(app, postTeamPayload(overrides))
}

async function postWeekend(teamId, overrides = {}) {
  return apiPostWeekend(app, teamId, postWeekendPayload(overrides))
}

async function listWeekends(teamId) {
  return apiListWeekends(app, teamId)
}

async function getWeekend(teamId, weekendId) {
  return apiGetWeekend(app, teamId, weekendId)
}

async function postTransition(teamId, weekendId, overrides = {}) {
  return apiPostTransition(app, teamId, weekendId, postTransitionPayload(overrides))
}

async function createTeamAndWeekend() {
  const team = await postTeam()
  const weekend = await postWeekend(team.body.id)
  return { team, weekend }
}

async function advanceToQualifyingQ1(teamId, weekendId) {
  await postTransition(teamId, weekendId, {
    toStage: WORKFLOW_STAGES.PRACTICE,
    toSegment: PRACTICE_SEGMENTS.P1,
  })
  await postTransition(teamId, weekendId, {
    toStage: WORKFLOW_STAGES.PRACTICE,
    toSegment: PRACTICE_SEGMENTS.P2,
  })
  await postTransition(teamId, weekendId, {
    toStage: WORKFLOW_STAGES.PRACTICE,
    toSegment: PRACTICE_SEGMENTS.P3,
  })
  await postTransition(teamId, weekendId, {
    toStage: WORKFLOW_STAGES.QUALIFYING,
    toSegment: QUALIFYING_SEGMENTS.NULL,
  })
  return postTransition(teamId, weekendId, {
    toStage: WORKFLOW_STAGES.QUALIFYING,
    toSegment: QUALIFYING_SEGMENTS.Q1,
  })
}

async function advanceToQualifyingQ3(teamId, weekendId) {
  await advanceToQualifyingQ1(teamId, weekendId)
  await postTransition(teamId, weekendId, {
    toStage: WORKFLOW_STAGES.QUALIFYING,
    toSegment: QUALIFYING_SEGMENTS.Q2,
  })
  return postTransition(teamId, weekendId, {
    toStage: WORKFLOW_STAGES.QUALIFYING,
    toSegment: QUALIFYING_SEGMENTS.Q3,
  })
}

beforeEach(() => {
  resetTeams()
  resetWeekends()
  resetAudit()
})

describe('Weekends API', () => {

  describe('POST /teams/:teamId/weekends', () => {
    // Happy path and contract test
    test('returns the created weekend body in JSON', async () => {
      const team = await postTeam()

      const res = await postWeekend(team.body.id, { name: ' Hungary ' })

      expect(res.statusCode).toBe(201)
      expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))
      expect(res.body).toEqual(expect.objectContaining({
        id: expect.any(Number),
        teamId: team.body.id,
        name: 'Hungary',
        currentSetupVersionNumber: 0,
        stage: WORKFLOW_STAGES.PRACTICE,
        segment: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }))
    })

    // Invalid path parameters
    describe('invalid path', () => {
      describe('teamId invalid returns 400', () => {
        test.each([
          ['string', 'id'],
          ['float', 1.1],
          ['boolean', true],
          ['zero', 0],
          ['negative', -1],
        ])('teamId as %s returns 400', async (_, teamId) => {
          const res = await postWeekend(teamId)

          expect(res.statusCode).toBe(400)
          expect(res.body).toEqual({
            error: {
              code: 400,
              message: 'Team id must be a positive integer',
            },
          })
        })
      })
    })

    // Invalid request body
    describe('invalid body', () => {
      test('missing request body returns 400', async () => {
        const team = await postTeam()

        const res = await request(app).post(`/teams/${team.body.id}/weekends`)

        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({
          error: {
            code: 400,
            message: 'Weekend name is required',
          },
        })
      })

      test('name missing returns 400', async () => {
        const team = await postTeam()

        payload = postWeekendPayload()
        delete payload.name

        const res = await request(app).post(`/teams/${team.body.id}/weekends`).send(payload)

        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({
          error: {
            code: 400,
            message: 'Weekend name is required',
          },
        })
      })

      describe('name invalid returns 400', () => {
        test.each([
          ['number', 123],
          ['boolean', true],
          ['null', null],
          ['object', {}],
          ['array', []],
          ['whitespace', '   '],
        ])('name as %s returns 400', async (_, name) => {
          const team = await postTeam()

          const res = await postWeekend(team.body.id, { name })

          expect(res.statusCode).toBe(400)
          expect(res.body).toEqual({
            error: {
              code: 400,
              message: 'Weekend name is required',
            },
          })
        })
      })
    })

    // Existence and conflict tests
    describe('existing resource checks', () => {
      test('team not found returns 404', async () => {
        const res = await postWeekend(1)

        expect(res.statusCode).toBe(404)
        expect(res.body).toEqual({
          error: {
            code: 404,
            message: 'Team not found',
          },
        })
      })

      test('duplicate exact name returns 409', async () => {
        const team = await postTeam()
        await postWeekend(team.body.id, { name: 'Australia' })

        const res = await postWeekend(team.body.id, { name: 'Australia' })

        expect(res.statusCode).toBe(409)
        expect(res.body).toEqual({
          error: {
            code: 409,
            message: 'This weekend already exists',
          },
        })
      })

      test('duplicate trimmed name returns 409', async () => {
        const team = await postTeam()
        await postWeekend(team.body.id, { name: 'Australia' })

        const res = await postWeekend(team.body.id, { name: '  Australia  ' })

        expect(res.statusCode).toBe(409)
        expect(res.body).toEqual({
          error: {
            code: 409,
            message: 'This weekend already exists',
          },
        })
      })
    })
  })

  describe('GET /teams/:teamId/weekends', () => {
    test('returns [] when the team has no weekends', async () => {
      const team = await postTeam()

      const res = await listWeekends(team.body.id)

      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual([])
    })

    test('returns only the weekends for the requested team in JSON', async () => {
      const firstTeam = await postTeam({ name: 'McLaren' })
      const secondTeam = await postTeam({ name: 'Ferrari' })

      const firstWeekend = await postWeekend(firstTeam.body.id, { name: 'Australia' })
      await postWeekend(secondTeam.body.id, { name: 'Japan' })

      const res = await listWeekends(firstTeam.body.id)

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))
      expect(res.body).toEqual([
        expect.objectContaining({
          id: firstWeekend.body.id,
          teamId: firstTeam.body.id,
          name: 'Australia',
          currentSetupVersionNumber: 0,
          stage: WORKFLOW_STAGES.PRACTICE,
          segment: null,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      ])
    })

    // Invalid path parameters
    describe('invalid path', () => {
      describe('teamId invalid returns 400', () => {
        test.each([
          ['string', 'nope'],
          ['float', 1.1],
          ['boolean', true],
          ['zero', 0],
          ['negative', -1],
        ])('teamId as %s returns 400', async (_, teamId) => {
          const res = await listWeekends(teamId)

          expect(res.statusCode).toBe(400)
          expect(res.body).toEqual({
            error: {
              code: 400,
              message: 'Team id must be a positive integer',
            },
          })
        })
      })
    })

    // Existence tests
    describe('existing resource checks', () => {
      test('team not found returns 404', async () => {
        const res = await listWeekends(999)

        expect(res.statusCode).toBe(404)
        expect(res.body).toEqual({
          error: {
            code: 404,
            message: 'Team not found',
          },
        })
      })
    })
  })

  // tid valid wid valid, get team works, team not exisr, weekend not exist

  describe('GET /teams/:teamId/weekends/:weekendId', () => {
    test('returns the requested weekend in JSON', async () => {
      const { team, weekend } = await createTeamAndWeekend()

      const res = await getWeekend(team.body.id, weekend.body.id)

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))
      expect(res.body).toEqual(expect.objectContaining({
        id: weekend.body.id,
        teamId: team.body.id,
        name: 'Australia',
        currentSetupVersionNumber: 0,
        stage: WORKFLOW_STAGES.PRACTICE,
        segment: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }))
    })

    // Invalid path parameters
    describe('invalid path', () => {
      describe('teamId invalid returns 400', () => {
        test.each([
          ['string', 'bad'],
          ['float', 1.1],
          ['boolean', true],
          ['zero', 0],
          ['negative', -1],
        ])('teamId as %s returns 400', async (_, teamId) => {
          const res = await getWeekend(teamId, 1)

          expect(res.statusCode).toBe(400)
          expect(res.body).toEqual({
            error: {
              code: 400,
              message: 'Team id must be a positive integer',
            },
          })
        })
      })

      describe('weekendId invalid returns 400', () => {
        test.each([
          ['string', 'bad'],
          ['float', 1.1],
          ['boolean', true],
          ['zero', 0],
          ['negative', -1],
        ])('weekendId as %s returns 400', async (_, weekendId) => {
          const team = await postTeam()

          const res = await getWeekend(team.body.id, weekendId)

          expect(res.statusCode).toBe(400)
          expect(res.body).toEqual({
            error: {
              code: 400,
              message: 'Weekend id must be a positive integer',
            },
          })
        })
      })
    })

    // Existence tests
    describe('existing resource checks', () => {
      test('team not found returns 404', async () => {
        const res = await getWeekend(999, 1)

        expect(res.statusCode).toBe(404)
        expect(res.body).toEqual({
          error: {
            code: 404,
            message: 'Team not found',
          },
        })
      })

      test('weekend not found returns 404', async () => {
        const team = await postTeam()

        const res = await getWeekend(team.body.id, 999)

        expect(res.statusCode).toBe(404)
        expect(res.body).toEqual({
          error: {
            code: 404,
            message: 'Weekend not found',
          },
        })
      })

      test('weekend from another team returns 404', async () => {
        const firstTeam = await postTeam({ name: 'McLaren' })
        const secondTeam = await postTeam({ name: 'Ferrari' })
        const weekend = await postWeekend(firstTeam.body.id)

        const res = await getWeekend(secondTeam.body.id, weekend.body.id)

        expect(res.statusCode).toBe(404)
        expect(res.body).toEqual({
          error: {
            code: 404,
            message: 'Weekend not found',
          },
        })
      })
    })
  })

  describe('POST /teams/:teamId/weekends/:weekendId/transition', () => {
    // Happy path and contract tests
    test('returns the transitioned weekend in JSON', async () => {
      const { team, weekend } = await createTeamAndWeekend()

      const res = await postTransition(team.body.id, weekend.body.id)

      expect(res.statusCode).toBe(201)
      expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))
      expect(res.body).toEqual(expect.objectContaining({
        id: weekend.body.id,
        teamId: team.body.id,
        name: 'Australia',
        stage: WORKFLOW_STAGES.PRACTICE,
        segment: PRACTICE_SEGMENTS.P1,
        currentSetupVersionNumber: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }))
    })

    test('allows the full workflow from practice to review', async () => {
      const { team, weekend } = await createTeamAndWeekend()

      const p1 = await postTransition(team.body.id, weekend.body.id, {
        toStage: WORKFLOW_STAGES.PRACTICE,
        toSegment: PRACTICE_SEGMENTS.P1,
      })
      const p2 = await postTransition(team.body.id, weekend.body.id, {
        toStage: WORKFLOW_STAGES.PRACTICE,
        toSegment: PRACTICE_SEGMENTS.P2,
      })
      const p3 = await postTransition(team.body.id, weekend.body.id, {
        toStage: WORKFLOW_STAGES.PRACTICE,
        toSegment: PRACTICE_SEGMENTS.P3,
      })
      const qualifying = await postTransition(team.body.id, weekend.body.id, {
        toStage: WORKFLOW_STAGES.QUALIFYING,
        toSegment: QUALIFYING_SEGMENTS.NULL,
      })
      const q1 = await postTransition(team.body.id, weekend.body.id, {
        toStage: WORKFLOW_STAGES.QUALIFYING,
        toSegment: QUALIFYING_SEGMENTS.Q1,
      })
      const q2 = await postTransition(team.body.id, weekend.body.id, {
        toStage: WORKFLOW_STAGES.QUALIFYING,
        toSegment: QUALIFYING_SEGMENTS.Q2,
      })
      const q3 = await postTransition(team.body.id, weekend.body.id, {
        toStage: WORKFLOW_STAGES.QUALIFYING,
        toSegment: QUALIFYING_SEGMENTS.Q3,
      })
      const race = await postTransition(team.body.id, weekend.body.id, {
        toStage: WORKFLOW_STAGES.RACE,
        toSegment: QUALIFYING_SEGMENTS.NULL,
      })
      const review = await postTransition(team.body.id, weekend.body.id, {
        toStage: WORKFLOW_STAGES.REVIEW,
        toSegment: QUALIFYING_SEGMENTS.NULL,
      })

      expect(p1.statusCode).toBe(201)
      expect(p2.statusCode).toBe(201)
      expect(p3.statusCode).toBe(201)
      expect(qualifying.statusCode).toBe(201)
      expect(q1.statusCode).toBe(201)
      expect(q2.statusCode).toBe(201)
      expect(q3.statusCode).toBe(201)
      expect(race.statusCode).toBe(201)
      expect(review.statusCode).toBe(201)
      expect(review.body.stage).toBe(WORKFLOW_STAGES.REVIEW)
      expect(review.body.segment).toBe(null)
    })

    test('returns the updated weekend from GET after a transition', async () => {
      const { team, weekend } = await createTeamAndWeekend()

      await postTransition(team.body.id, weekend.body.id, {
        toStage: WORKFLOW_STAGES.PRACTICE,
        toSegment: PRACTICE_SEGMENTS.P1,
      })

      const res = await getWeekend(team.body.id, weekend.body.id)

      expect(res.statusCode).toBe(200)
      expect(res.body.stage).toBe(WORKFLOW_STAGES.PRACTICE)
      expect(res.body.segment).toBe(PRACTICE_SEGMENTS.P1)
    })

    // Invalid path parameters
    describe('invalid path', () => {
      describe('teamId invalid returns 400', () => {
        test.each([
          ['string', 'bad'],
          ['float', 1.1],
          ['boolean', true],
          ['zero', 0],
          ['negative', -1],
        ])('teamId as %s returns 400', async (_, teamId) => {
          const { team, weekend } = await createTeamAndWeekend()

          const res = await postTransition(teamId, weekend.body.id)

          expect(res.statusCode).toBe(400)
          expect(res.body).toEqual({
            error: {
              code: 400,
              message: 'Team id must be a positive integer',
            },
          })
        })
      })

      describe('weekendId invalid returns 400', () => {
        test.each([
          ['string', 'bad'],
          ['float', 1.1],
          ['boolean', true],
          ['zero', 0],
          ['negative', -1],
        ])('weekendId as %s returns 400', async (_, weekendId) => {
          const { team } = await createTeamAndWeekend()

          const res = await postTransition(team.body.id, weekendId)

          expect(res.statusCode).toBe(400)
          expect(res.body).toEqual({
            error: {
              code: 400,
              message: 'Weekend id must be a positive integer',
            },
          })
        })
      })
    })

    // Invalid request body
    describe('invalid body', () => {
      test('missing request body returns 400', async () => {
        const { team, weekend } = await createTeamAndWeekend()

        const res = await request(app)
          .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/transition`)

        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({
          error: {
            code: 400,
            message: 'actorRole is required',
          },
        })
      })

      test('missing actorRole returns 400', async () => {
        const { team, weekend } = await createTeamAndWeekend()
        const payload = postTransitionPayload()
        delete payload.actorRole

        const res = await request(app)
          .post(`/teams/${team.body.id}/weekends/${weekend.body.id}/transition`)
          .send(payload)

        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({
          error: {
            code: 400,
            message: 'actorRole is required',
          },
        })
      })

      describe('actorName invalid returns 400', () => {
        test.each([
          ['missing', undefined],
          ['number', 123],
          ['boolean', true],
          ['null', null],
          ['whitespace', '   '],
        ])('actorName as %s returns 400', async (_, actorName) => {
          const { team, weekend } = await createTeamAndWeekend()

          const res = await postTransition(team.body.id, weekend.body.id, { actorName })

          expect(res.statusCode).toBe(400)
          expect(res.body).toEqual({
            error: {
              code: 400,
              message: 'actorName is required',
            },
          })
        })
      })

      describe('invalid stage or segment returns 400', () => {
        test('invalid stage name returns 400', async () => {
          const { team, weekend } = await createTeamAndWeekend()

          const res = await postTransition(team.body.id, weekend.body.id, {
            toStage: 'NotAStage',
          })

          expect(res.statusCode).toBe(400)
          expect(res.body).toEqual({
            error: {
              code: 400,
              message: 'Invalid stage name',
            },
          })
        })

        test('invalid segment returns 400', async () => {
          const { team, weekend } = await createTeamAndWeekend()

          const res = await postTransition(team.body.id, weekend.body.id, {
            toSegment: 'P9',
          })

          expect(res.statusCode).toBe(400)
          expect(res.body).toEqual({
            error: {
              code: 400,
              message: 'Invalid segment',
            },
          })
        })
      })
    })

    // Authorisation and existence checks
    describe('rejected requests', () => {
      test('actorRole not being lead engineer returns 403', async () => {
        const { team, weekend } = await createTeamAndWeekend()

        const res = await postTransition(team.body.id, weekend.body.id, {
          actorRole: ROLES.ENGINEER,
        })

        expect(res.statusCode).toBe(403)
        expect(res.body).toEqual({
          error: {
            code: 403,
            message: 'Only the Lead Engineer can transition stages',
          },
        })
      })

      test('team not found returns 409', async () => {
        const { weekend } = await createTeamAndWeekend()

        const res = await postTransition(999, weekend.body.id)

        expect(res.statusCode).toBe(409)
        expect(res.body).toEqual({
          error: {
            code: 409,
            message: 'Team not found',
          },
        })
      })

      test('weekend not found returns 404', async () => {
        const team = await postTeam()

        const res = await postTransition(team.body.id, 999)

        expect(res.statusCode).toBe(404)
        expect(res.body).toEqual({
          error: {
            code: 404,
            message: 'Weekend not found',
          },
        })
      })

      test('weekend from another team returns 404', async () => {
        const firstTeam = await postTeam({ name: 'McLaren' })
        const secondTeam = await postTeam({ name: 'Ferrari' })
        const weekend = await postWeekend(firstTeam.body.id)

        const res = await postTransition(secondTeam.body.id, weekend.body.id)

        expect(res.statusCode).toBe(404)
        expect(res.body).toEqual({
          error: {
            code: 404,
            message: 'Weekend not found',
          },
        })
      })
    })

    // Invalid transition rules
    describe('invalid transitions', () => {
      test('cannot move straight from practice to race', async () => {
        const { team, weekend } = await createTeamAndWeekend()

        const res = await postTransition(team.body.id, weekend.body.id, {
          toStage: WORKFLOW_STAGES.RACE,
          toSegment: PRACTICE_SEGMENTS.P1,
        })

        expect(res.statusCode).toBe(409)
        expect(res.body).toEqual({
          error: {
            code: 409,
            message: 'Workflow transition is not allowed from the current stage',
          },
        })
      })

      test('cannot skip from no practice segment to P2', async () => {
        const { team, weekend } = await createTeamAndWeekend()

        const res = await postTransition(team.body.id, weekend.body.id, {
          toStage: WORKFLOW_STAGES.PRACTICE,
          toSegment: PRACTICE_SEGMENTS.P2,
        })

        expect(res.statusCode).toBe(409)
        expect(res.body).toEqual({
          error: {
            code: 409,
            message: 'Segment transition is not allowed from the current stage',
          },
        })
      })

      test('cannot move from practice P2 to qualifying', async () => {
        const { team, weekend } = await createTeamAndWeekend()

        await postTransition(team.body.id, weekend.body.id, {
          toStage: WORKFLOW_STAGES.PRACTICE,
          toSegment: PRACTICE_SEGMENTS.P1,
        })
        await postTransition(team.body.id, weekend.body.id, {
          toStage: WORKFLOW_STAGES.PRACTICE,
          toSegment: PRACTICE_SEGMENTS.P2,
        })

        const res = await postTransition(team.body.id, weekend.body.id, {
          toStage: WORKFLOW_STAGES.QUALIFYING,
          toSegment: QUALIFYING_SEGMENTS.NULL,
        })

        expect(res.statusCode).toBe(409)
        expect(res.body).toEqual({
          error: {
            code: 409,
            message: 'Workflow transition is not allowed from the current stage',
          },
        })
      })

      test('cannot move from qualifying Q1 to race', async () => {
        const { team, weekend } = await createTeamAndWeekend()

        await advanceToQualifyingQ1(team.body.id, weekend.body.id)

        const res = await postTransition(team.body.id, weekend.body.id, {
          toStage: WORKFLOW_STAGES.RACE,
          toSegment: QUALIFYING_SEGMENTS.NULL,
        })

        expect(res.statusCode).toBe(409)
        expect(res.body).toEqual({
          error: {
            code: 409,
            message: 'Workflow transition is not allowed from the current stage',
          },
        })
      })

      test('race transition requires a null segment', async () => {
        const { team, weekend } = await createTeamAndWeekend()

        await advanceToQualifyingQ3(team.body.id, weekend.body.id)

        const res = await postTransition(team.body.id, weekend.body.id, {
          toStage: WORKFLOW_STAGES.RACE,
          toSegment: QUALIFYING_SEGMENTS.Q3,
        })

        expect(res.statusCode).toBe(409)
        expect(res.body).toEqual({
          error: {
            code: 409,
            message: 'Segment transition is not allowed from the current stage',
          },
        })
      })
    })

    describe('side effects', () => {
      test('rejected transition does not change the weekend state', async () => {
        const { team, weekend } = await createTeamAndWeekend()

        await postTransition(team.body.id, weekend.body.id, {
          toStage: WORKFLOW_STAGES.PRACTICE,
          toSegment: PRACTICE_SEGMENTS.P1,
        })

        const rejected = await postTransition(team.body.id, weekend.body.id, {
          toStage: WORKFLOW_STAGES.RACE,
          toSegment: PRACTICE_SEGMENTS.P1,
        })
        const current = await getWeekend(team.body.id, weekend.body.id)

        expect(rejected.statusCode).toBe(409)
        expect(current.statusCode).toBe(200)
        expect(current.body.stage).toBe(WORKFLOW_STAGES.PRACTICE)
        expect(current.body.segment).toBe(PRACTICE_SEGMENTS.P1)
      })

      test('successful transition creates an audit event', async () => {
        const { team, weekend } = await createTeamAndWeekend()

        const transitionRes = await postTransition(team.body.id, weekend.body.id)

        expect(transitionRes.statusCode).toBe(201)

        const audit = getAuditForWeekend(team.body.id, weekend.body.id)

        expect(audit).toHaveLength(1)
        expect(audit[0]).toEqual(expect.objectContaining({
          type: 'WEEKEND_STAGE_TRANSITION',
          teamId: team.body.id,
          weekendId: weekend.body.id,
          actorName: 'Alex Engineer',
          actorRole: ROLES.LEAD_ENGINEER,
          fromStage: WORKFLOW_STAGES.PRACTICE,
          toStage: WORKFLOW_STAGES.PRACTICE,
          fromSegment: null,
          toSegment: PRACTICE_SEGMENTS.P1,
          createdAt: expect.any(String),
        }))
      })

      test('rejected transition does not create an audit event', async () => {
        const { team, weekend } = await createTeamAndWeekend()

        const res = await postTransition(team.body.id, weekend.body.id, {
          toStage: WORKFLOW_STAGES.RACE,
          toSegment: null,
        })

        expect(res.statusCode).toBe(409)
        expect(getAuditForWeekend(team.body.id, weekend.body.id)).toEqual([])
      })
    })
  })
})
