function createAppError(message, code) {
  const err = new Error(message)
  err.code = code
  return err
}

function throwAppError(message, code) {
  throw createAppError(message, code)
}

module.exports = {
  createAppError,
  throwAppError,
}
