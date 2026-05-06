const create = require('./create')
const list = require('./list')
const update = require('./update')

const handlers = {
  create: create.main,
  list: list.main,
  update: update.main
}

exports.main = async (event, context) => {
  const action = event && event.action
  const handler = handlers[action]

  if (!handler) {
    return { code: -1, message: `未知 dog action: ${action || ''}` }
  }

  return handler(event, context)
}
