const ERROR_CODES = {
  // 400 Bad Request — the client sent invalid or missing data
  BAD_REQUEST: 'BAD_REQUEST',

  // 404 Not Found — the requested resource does not exist
  NOT_FOUND: 'NOT_FOUND',

  // 409 Conflict — the request is valid but conflicts with current state
  // e.g. duplicate resource, invalid workflow transition
  DUPLICATE: 'DUPLICATE',

  // 409 Conflict — workflow or segment transition is not allowed
  INVALID_TRANSITION: 'INVALID_TRANSITION',

  // 403 Forbidden — the user is authenticated but not allowed to perform this action
  FORBIDDEN: 'FORBIDDEN',
}

module.exports = { ERROR_CODES }
