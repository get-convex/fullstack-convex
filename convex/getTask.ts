import { query } from './_generated/server'
import { Document } from './_generated/dataModel'
import { Visibility } from './schema'

export interface Task extends Document<'tasks'> {
  owner: Document<'users'> | null
}

export default query(
  async ({ db, auth }, taskNumber: number | 'new' | null) => {
    if (typeof taskNumber !== 'number') return null
    const identity = await auth.getUserIdentity()
    const task = await db
      .query('tasks')
      .withIndex('by_number', (q) => q.eq('number', taskNumber))
      .unique()
    if (!task) return null

    const owner = task.ownerId && (await db.get(task.ownerId))

    if (task.visibility === Visibility.PRIVATE) {
      if (!identity) throw new Error('You must be logged in to view this task')
      if (identity.tokenIdentifier !== owner?.tokenIdentifier)
        throw new Error('You do not have permission to view this task')
    }

    return { ...task, owner }
  }
)
