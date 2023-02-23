import { query, type DatabaseReader } from './_generated/server'
import type { Document, Id } from './_generated/dataModel'

export interface File extends Document<'files'> {
  author: Document<'users'>
}

// Expose this as its own function for reusability in other queries
export function findFilesByTask(db: DatabaseReader, taskId: Id<'tasks'>) {
  return db.query('files').withIndex('by_task', (q) => q.eq('taskId', taskId))
}

export default query(async ({ db }, taskId: Id<'tasks'>) => {
  const files = await findFilesByTask(db, taskId).collect()

  // Join with author details from users table
  return Promise.all(
    files.map(async (c) => {
      const author = await db.get(c.userId)
      if (!author) throw new Error('File author not found')
      return { ...c, author }
    })
  )
})
