const { ROLES } = require('../../constants/roles')
const { baseParameters } = require('./api')

function setupVersionsRequestsBasePayload(overrides = {}) {
    return {
        parameters: baseParameters(),
        requestedBy: 'Jack Brierly',
        requestedByRole: ROLES.ENGINEER,
        requestedTo: 'John Parker',
        requestedToRole: ROLES.LEAD_ENGINEER,
        ...overrides,
    }
}

module.exports = { setupVersionsRequestsBasePayload }
