const express = require('express')
const app = express()

// Parse JSON request bodies
app.use(express.json())

// Basic health check endpoint for uptime monitoring
app.get('/health', (req, res) => {
    res.json({status: 'A-OK'})
})

// Start the HTTP server
app.listen(3000, (req, res) => {
    console.log('Server running on port 3000')
})
