// Import Express so we can create a router for these endpoints
const express = require('express')

// Create a new router instance
// mergeParams: true allows this router to access route parameters
// from parent routes (e.g. teamId and weekendId from /teams/:teamId/weekends/:weekendId)
const router = express.Router({ mergeParams: true })

const setupVersionsRequestsController = require('../controllers/setupVersionsRequests.controller')
const { listSetupVersionsForWeekend } = require('../data/setupVersions.data')

// POST /setupVersionsRequests
// Create setup version is called when approved or when not in need of approval 
router.post('/', setupVersionsRequestsController.createSetupVersionRequest)

// POST /setupVersionsRequests/:id/accept
// Accept setup version request
router.post('/:setupVersionRequestId/accept', setupVersionsRequestsController.acceptSetupVersionRequest)

// POST /setupVersionsRequests/:id/decline
// Decline setup version request
router.post('/:setupVersionRequestId/decline', setupVersionsRequestsController.declineSetupVersionRequest)

// GET /setupVersionsRequests
router.get('/', setupVersionsRequestsController.listSetupVersionsRequestsForWeekend)

// POST /setupVersions/:id/decline
// Decline setup version request
// router.post('/:setupVersionRequestId/decline', setupVersionsRequestsController.declineSetupVersionRequest)

// we expore as router and not { router } so that the file exports the router directly
// so when weekends.router calls const setupVersionsRouter = require('./setupVersions.routes')
// that is assigning the router to setupVersionsRouter
module.exports = router