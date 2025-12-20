const express = require('express')
const router = express.Router()

const {
  createTeam,
  listTeams,
} = require('../controllers/teams.controller')

// POST /teams
router.post('/', createTeam)

// GET /teams
router.get('/', listTeams)

const weekendsRouter = require('./weekends.routes')
// Forward '/:teamId/weekends' to weekendsRouter
router.use('/:teamId/weekends', weekendsRouter)

module.exports = router