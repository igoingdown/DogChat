const login = require('./login')

const handlers = {
  login: login.main
}

exports.main = async (event, context) => {
  const action = event && event.action
  const handler = handlers[action]

  if (!handler) {
    return { code: -1, message: `未知 user action: ${action || ''}` }
  }

  return handler(event, context)
}
