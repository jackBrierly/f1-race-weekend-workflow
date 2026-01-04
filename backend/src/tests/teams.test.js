const request = require('supertest')
const app = require('../app')
const { resetTeams } = require('../data/teams.data')

// Small helper so we don't repeat POST boilerplate everywhere
async function createTeam(name) {
  return request(app).post('/teams').send({ name })
}

beforeEach(() => {
  resetTeams()
})

describe('Teams API', () => {
  describe('POST /teams', () => {
    test('201 when name is provided', async () => {
      const res = await createTeam('McLaren')
      expect(res.statusCode).toBe(201)
      expect(res.body.name).toBe('McLaren')
    })

    test('trims name and returns id/createdAt', async () => {
      const res = await createTeam('  Ferrari  ')
      expect(res.statusCode).toBe(201)
      expect(res.body).toEqual(expect.objectContaining({
        id: expect.any(Number),
        name: 'Ferrari',
        createdAt: expect.any(String),
      }))
    })

    test('400 when name is missing', async () => {
      const res = await request(app).post('/teams').send({})
      expect(res.statusCode).toBe(400)
    })

    test('400 when name is whitespace', async () => {
      const res = await createTeam('   ')
      expect(res.statusCode).toBe(400)
    })

    test('400 when name is not a string', async () => {
      const res = await createTeam(123)
      expect(res.statusCode).toBe(400)
    })

    test('409 when name already exists (case-insensitive + trimmed)', async () => {
      await createTeam('Mercedes')
      const dup = await createTeam(' mercedes ')
      expect(dup.statusCode).toBe(409)
    })

    test('Content-Type is JSON', async () => {
      const res = await createTeam('Ferrari')
      expect(res.headers['content-type']).toEqual(expect.stringContaining('json'))
    })
  })

  describe('GET /teams', () => {
    test('200 and [] when empty', async () => {
      const res = await request(app).get('/teams')
      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual([])
    })

    test('returns created teams', async () => {
      const a = await createTeam('Alpha')
      const b = await createTeam('Beta')

      const res = await request(app).get('/teams')
      expect(res.statusCode).toBe(200)
      expect(res.body.map(t => t.id)).toEqual([a.body.id, b.body.id])
    })
  })

  describe('GET /teams/:teamId', () => {
    test('200 and returns the team when it exists', async () => {
      const created = await createTeam('Red Bull')
      const res = await request(app).get(`/teams/${created.body.id}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.id).toBe(created.body.id)
      expect(res.body.name).toBe('Red Bull')
    })

    test('404 when team does not exist', async () => {
      const res = await request(app).get('/teams/999')
      expect(res.statusCode).toBe(404)
    })

    test('400 when teamId is not a positive integer', async () => {
      const res = await request(app).get('/teams/not-a-number')
      expect(res.statusCode).toBe(400)
    })
  })
})
