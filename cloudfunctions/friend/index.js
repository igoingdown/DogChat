const request = require('./request')
const confirm = require('./confirm')
const list = require('./list')

const handlers = {
  request: request.main,
  confirm: confirm.main,
  list: list.main
}

exports.main = async (event, context) => {
  const action = event && event.action
  const handler = handlers[action]

  if (!handler) {
    return { code: -1, message: `未知 friend action: ${action || ''}` }
  }

  return handler(event, context)
}
