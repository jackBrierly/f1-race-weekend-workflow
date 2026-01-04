const express = require('express')
// Create a router for /teams endpoints
const router = express.Router()

// Controller functions that handle the request/response
const {
  createTeam,
  listTeams,
  getTeam,
} = require('../controllers/teams.controller')

// POST /teams - create a new team
router.post('/', createTeam)

// GET /teams - list all teams
router.get('/', listTeams)

// GET /teams/:teamId - get a single team
router.get('/:teamId', getTeam)

const weekendsRouter = require('./weekends.routes')
// Mount weekends routes under a specific team
router.use('/:teamId/weekends', weekendsRouter)

module.exports = router
