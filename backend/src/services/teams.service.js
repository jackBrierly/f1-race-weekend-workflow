const teamsModel = require('../models/teams.model')
const { throwAppError } = require('../utils/app-error')

function createTeam(name) {
  if (teamsModel.teamNameExists(name.toLowerCase())) {
    throwAppError('Team name already exists', 'DUPLICATE')
  }

  return teamsModel.createTeam(name)
}

function listTeams() {
  return teamsModel.listTeams()
}

function getTeam(teamId) {
  const team = teamsModel.findTeamById(teamId)

  if (!team) {
    throwAppError('Team not found', 'TEAM_NOT_FOUND')
  }

  return team
}

module.exports = {
  createTeam,
  listTeams,
  getTeam,
}
