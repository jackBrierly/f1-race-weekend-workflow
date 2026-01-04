const express = require('express')
const app = express()

// Parse JSON request bodies
app.use(express.json())

// Import the teams router
const teamsRouter = require('./routes/teams.routes')
// Forward all '/teams' to the teams router
app.use('/teams', teamsRouter)

// Basic health check endpoint for uptime monitoring
app.get('/health', (req, res) => {
    res.json({status: 'ok'})
})

// Start the HTTP server
// This is commented out so the Express app can be reused by tests.
// In tests, Supertest runs the app without binding to a network port.
// The server is started only in the production/dev entry point.
// app.listen(3000, () => {
//     console.log('Server running on port 3000')
// })

// Export the Express app so it can be used by both the server entry point and the test runner
module.exports = app