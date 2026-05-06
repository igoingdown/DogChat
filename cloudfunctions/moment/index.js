const create = require('./create')
const list = require('./list')
const like = require('./like')
const comment = require('./comment')

const handlers = {
  create: create.main,
  list: list.main,
  like: like.main,
  comment: comment.main
}

exports.main = async (event, context) => {
  const action = event && event.action
  const handler = handlers[action]

  if (!handler) {
    return { code: -1, message: `未知 moment action: ${action || ''}` }
  }

  return handler(event, context)
}
