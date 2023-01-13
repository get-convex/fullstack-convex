import { query } from './_generated/server'
import { Document, Id } from './_generated/dataModel'

export default query(
  async ({ db, auth }, taskNumber: number): Promise<Document> => {
    const identity = await auth.getUserIdentity()
    const task = await db
      .query('tasks')
      .filter((q) => q.eq(q.field('number'), taskNumber))
      .unique()
    if (!task) return null
    const owner = await db.get(task.ownerId)
    if (task.visibility === 'private') {
      // TODO currently only available to logged-in users, will change
      if (!identity) return { error: 'You must be logged in to view this task' }
      if (identity.tokenIdentifier !== owner.tokenIdentifier)
        return { error: 'You do not have permission to view this task' }
    }

    return { ...task, owner }
  }
)
