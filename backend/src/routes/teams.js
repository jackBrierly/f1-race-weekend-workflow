const express = require("express")
const router = express.Router()

// In-memory store for teams; resets on server restart
const teams = []

// Handle a POST request to '/teams'
// Create a team and return it
router.post("/", (req, res) => {
    // Brackets are used to extract the `name` value from the JSON request body (e.g. { "name": "McLaren" })
    const { name } = req.body
    // If no name exists, return a 400 Bad Request
    if (!name) {
        return res.status(400).json({ error: "Name is required" })
    }


    // Build the new team object with an auto-incremented id and timestamp
    const team = {
        id: teams.length + 1,
        name,
        createdAt: new Date()
    }

    teams.push(team)

    console.log(teams)

    // Respond with HTTP 201 (Created) to indicate a new team was successfully created,
    // and return the created team in the response body.
    res.status(201).json(team)
    })

    // List all teams
    router.get("/", (req, res) => {
    res.json(teams)
})

// Export the router for use in the main index file
module.exports = router