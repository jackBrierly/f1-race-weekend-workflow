const express = require("express")
const router = express.Router();

const {
  createTeam,
  listTeams,
} = require("../controllers/teams.controller")

// POST /teams
router.post("/", createTeam)

// GET /teams
router.get("/", listTeams)

module.exports = router