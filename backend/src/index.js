// app.js defines routes and middleware but does not start the server.
const app = require('./app')

// Azure (and most cloud platforms) assign a port dynamically using an
// environment variable called PORT. Locally, this variable usually
// doesn't exist, so we fall back to port 3000.
const PORT = process.env.PORT || 3000

// Start the HTTP server and bind it to the selected port.
// In production (Azure), this will use the port Azure provides.
// In local development, it will run on http://localhost:3000.
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})