const create = require('./create')
const list = require('./list')
const respond = require('./respond')

const handlers = {
  create: create.main,
  list: list.main,
  respond: respond.main
}

exports.main = async (event, context) => {
  const action = event && event.action
  const handler = handlers[action]

  if (!handler) {
    return { code: -1, message: `未知 walk action: ${action || ''}` }
  }

  return handler(event, context)
}
