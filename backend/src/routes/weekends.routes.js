const express = require('express')
const router = express.Router({ mergeParams: true })

const {
    createWeekend,
    listWeekends,
} = require('../controllers/weekends.controller')

// POST /teams/:teamId/weekends
router.post('/', createWeekend)

// GET /teams/:teamId/weekends
router.get('/', listWeekends)

module.exports = router
