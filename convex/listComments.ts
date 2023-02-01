import { query, type DatabaseReader } from './_generated/server'
import type { Document, Id } from './_generated/dataModel'

// Expose this as its own function for reusability in other queries
export function findCommentsByTask(db: DatabaseReader, taskId: Id) {
  return db.query('comments').filter((q) => q.eq(q.field('taskId'), taskId))
}

export default query(async ({ db }, taskId: Id): Promise<Document[]> => {
  const comments = await findCommentsByTask(db, taskId).collect()

  // Join with author details from users table
  return Promise.all(
    comments.map(async (c) => {
      const author = c.userId && (await db.get(c.userId))
      return { ...c, author }
    })
  )
})
