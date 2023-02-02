import { query, type DatabaseReader } from './_generated/server'
import type { Document, Id } from './_generated/dataModel'

export interface Comment extends Document<'comments'> {
  author: Document<'users'>
}

// Expose this as its own function for reusability in other queries
export function findCommentsByTask(db: DatabaseReader, taskId: Id<'tasks'>) {
  return db
    .query('comments')
    .withIndex('by_task', (q) => q.eq('taskId', taskId))
}

export default query(async ({ db }, taskId: Id<'tasks'>) => {
  const comments = await findCommentsByTask(db, taskId).collect()

  // Join with author details from users table
  return Promise.all(
    comments.map(async (c) => {
      const author = await db.get(c.userId)
      if (!author) throw new Error('Comment author not found')
      return { ...c, author }
    })
  )
})
