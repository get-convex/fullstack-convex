import { query } from './_generated/server'
import { Document, Id } from './_generated/dataModel'

export default query(async ({ db }, taskId: Id): Promise<Document[]> => {
  const comments = await db
    .query('comments')
    .filter((q) => q.eq(q.field('taskId'), taskId))
    .collect()

  // Join with author details from users table
  return Promise.all(
    comments.map(async (c) => {
      const author = c.userId && (await db.get(c.userId))
      return { ...c, author }
    })
  )
})
