import { query } from './_generated/server'
import { Document, Id } from './_generated/dataModel'

export default query(async ({ db, auth }, taskId: Id): Promise<Document> => {
  const identity = await auth.getUserIdentity()
  const task = await db.get(taskId)
  const owner = await db.get(task.ownerId)
  if (!task) return null
  if (task.visibility === 'private') {
    // TODO currently only logged-in users
    if (!identity) return { error: 'You must be logged in to view this task' }
    if (identity.tokenIdentifier !== owner.tokenIdentifier)
      return { error: 'You do not have permission to view this task' }
  }

  return { ...task, owner }
})
