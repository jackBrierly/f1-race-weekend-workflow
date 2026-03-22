const request = require('supertest')
const app = require('../app')
const { resetTeams, teamExistsById } = require('../models/teams.model')
const {
  postTeam: apiPostTeam,
  listTeams: apiListTeams,
  getTeam: apiGetTeam,
} = require('./helpers/teams')

function postTeamPayload(overrides = {}) {
  return {
    name: 'McLaren',
    ...overrides,
  }
}

async function postTeam(overrides = {}) {
  return apiPostTeam(app, postTeamPayload(overrides))
}

async function listTeams() {
  return apiListTeams(app)
}

async function getTeam(teamId) {
  return apiGetTeam(app, teamId)
}

beforeEach(() => {
  resetTeams()
})

describe('Teams API', () => {
  describe('POST /teams', () => {

    // Happy Path and Contract Test
    test('returns the created team body in JSON', async () => {
      const res = await postTeam({ name: '  Ferrari  ' })
      

      expect(res.statusCode).toBe(201) 
      expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))
      expect(res.body).toEqual(expect.objectContaining({
        id: expect.any(Number),
        name: 'Ferrari',
        createdAt: expect.any(String),
      }))
    })

    // Validation Tests and Existence Tests
    describe('invalid body', () => {

      test('name missing returns 400', async () => {
        const payload = postTeamPayload()
        delete payload.name

        const res = await request(app).post('/teams').send(payload)

        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({
          error: {
            code: 400,
            message: 'Team name must be a non-empty string',
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
          const res = await postTeam({ name })

          expect(res.statusCode).toBe(400)
          expect(res.body).toEqual({
            error: {
              code: 400,
              message: 'Team name must be a non-empty string',
            },
          })
        })
      })

      test('duplicate exact name returns 409', async () => {
        await postTeam({ name: 'Mercedes' })

        const res = await postTeam({ name: 'Mercedes' })

        expect(res.statusCode).toBe(409)
        expect(res.body).toEqual({
          error: {
            code: 409,
            message: 'Team name already exists',
          },
        })
      })

      test('duplicate trimmed and case-insensitive name returns 409', async () => {
        await postTeam({ name: 'Mercedes' })

        const res = await postTeam({ name: ' mercedes ' })

        expect(res.statusCode).toBe(409)
        expect(res.body).toEqual({
          error: {
            code: 409,
            message: 'Team name already exists',
          },
        })
      })
    })
  })

  describe('GET /teams', () => {
    test('200 and [] when no teams exist', async () => {
      const res = await listTeams()

      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual([])
    })

    test('200 and returns created teams in insertion order and JSON', async () => {
      const first = await postTeam({ name: '  AlphaTauri  ' })
      const second = await postTeam({ name: 'Williams' })

      const res = await listTeams()

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))
      expect(res.body).toEqual([
        expect.objectContaining({
          id: first.body.id,
          name: 'AlphaTauri',
          createdAt: expect.any(String),
        }),
        expect.objectContaining({
          id: second.body.id,
          name: 'Williams',
          createdAt: expect.any(String),
        }),
      ])
    })
  })

  describe('GET /teams/:teamId', () => {
    test('200 and returns the requested team', async () => {
      const created = await postTeam({ name: 'Red Bull' })

      const res = await getTeam(created.body.id)

      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual(expect.objectContaining({
        id: created.body.id,
        name: 'Red Bull',
        createdAt: expect.any(String),
      }))
    })

    test('200 and existing team is returned in JSON', async () => {
      const created = await postTeam({ name: 'Aston Martin' })

      const res = await getTeam(created.body.id)

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))
      expect(res.body).toEqual({
        id: created.body.id,
        name: 'Aston Martin',
        createdAt: expect.any(String),
      })
    })

    describe('invalid body', () => {
      describe('teamId invalid returns 400', () => {
        test.each([
          ['string', 'not-a-number'],
          ['float', 1.1],
          ['boolean', true],
          ['zero', 0],
          ['negative', -1],
        ])('teamId as %s returns 400', async (_, teamId) => {
          const res = await getTeam(teamId)

          expect(res.statusCode).toBe(400)
          expect(res.body).toEqual({
            error: {
              code: 400,
              message: 'Team id must be a positive integer',
            },
          })
        })
      })

      test('team not found returns 404', async () => {
        const res = await getTeam(999)

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

  describe('teams.model helpers', () => {
    // This is tested as it is not exercised by the teams endpoints.
    test('teamExistsById returns true only for teams that exist', async () => {
      expect(teamExistsById(1)).toBe(false)

      const created = await postTeam({ name: 'Kick Sauber' })

      expect(teamExistsById(created.body.id)).toBe(true)
      expect(teamExistsById(created.body.id + 1)).toBe(false)
    })
  })
})
