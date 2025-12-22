const express = require('express')
// Merge params so :teamId from the parent route is available here
const router = express.Router({ mergeParams: true })

// Controller functions that handle the request/response
const {
    createWeekend,
    listWeekends,
    getWeekend,
    transitionWeekendStage,
} = require('../controllers/weekends.controller')

// POST /teams/:teamId/weekends - create a weekend for a team
router.post('/', createWeekend)

// GET /teams/:teamId/weekends - list weekends for a team
router.get('/', listWeekends)

// GET /teams/:teamId/weekends/:weekendId - get a single weekend
router.get('/:weekendId', getWeekend)

// POST /teams/{teamId}/weekends/{weekendId}/transition - transition weekend stage
router.post('/:weekendId/transition', transitionWeekendStage)

module.exports = router
