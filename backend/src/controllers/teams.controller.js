const teamsService = require('../services/teams.service')
const { parsePositiveIntId, requireNonEmptyString } = require('../utils/request-validators')
const { withErrorHandling } = require('../utils/controller-error-handler')

function createTeam(req, res) {
  let { name } = req.body || {}

  return withErrorHandling(res, () => {
    name = requireNonEmptyString(name, 'Team name')
    const team = teamsService.createTeam(name)
    return res.status(201).json(team)
  })
}

function getTeams(req, res) {
  return withErrorHandling(res, () => {
    const teams = teamsService.listTeams()
    return res.status(200).json(teams)
  })
}

function getTeam(req, res) {
  let { teamId } = req.params

  return withErrorHandling(res, () => {
    teamId = parsePositiveIntId(teamId, 'Team')
    const team = teamsService.getTeam(teamId)
    return res.status(200).json(team)
  })
}

module.exports = {
  createTeam,
  getTeams,
  getTeam,
}
