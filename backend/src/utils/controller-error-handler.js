function mapErrorToHttp(res, err) {
  if (['INVALID_ID', 'INVALID_OBJECT', 'INVALID_STRING', 'INVALID_ROLE', 'INVALID_USER', 'INVALID_REQUEST_STATUS', 'INVALID_STAGE_NAME', 'INVALID_SEGMENT'].includes(err.code)) {
    return res.status(400).json({ error: { code: 400, message: err.message } })
  }

  if (err.code === 'FORBIDDEN') {
    return res.status(403).json({ error: { code: 403, message: err.message } })
  }

  if (['TEAM_NOT_FOUND', 'WEEKEND_NOT_FOUND', 'SETUP_VERSION_NOT_FOUND', 'SETUP_VERSION_REQUEST_NOT_FOUND'].includes(err.code)) {
    return res.status(404).json({ error: { code: 404, message: err.message } })
  }

  if (err.code === 'TRANSITION_TEAM_NOT_FOUND') {
    return res.status(409).json({ error: { code: 409, message: err.message } })
  }

  if (['INVALID_STAGE', 'DUPLICATE', 'INVALID_TRANSITION'].includes(err.code)) {
    return res.status(409).json({ error: { code: 409, message: err.message } })
  }

  return res.status(500).json({ error: { code: 500, message: err.message } })
}

function withErrorHandling(res, fn) {
  try {
    return fn()
  } catch (err) {
    return mapErrorToHttp(res, err)
  }
}

module.exports = {
  mapErrorToHttp,
  withErrorHandling,
}
