import { query } from './_generated/server'
import { Document } from './_generated/dataModel'
import { findUser } from './getCurrentUser'

export default query(
  async ({ db, auth }, statusFilter: string[]): Promise<Document[]> => {
    // If logged in, fetch the stored user to get ID for filtering
    const user = await findUser(db, auth)

    const tasks = await db
      .query('tasks')
      .filter((q) =>
        q.and(
          user
            ? // Logged in users see their private tasks as well as public
              q.or(
                q.eq(q.field('visibility'), 'public'),
                q.eq(q.field('ownerId'), user._id)
              )
            : // Logged out users only see public tasks
              q.eq(q.field('visibility'), 'public'),
          q.or(
            // Match any of the given status values
            ...statusFilter.map((status: string) =>
              q.eq(q.field('status'), status)
            )
          )
        )
      )
      .collect()

    // Join with owner details from users table
    return Promise.all(
      tasks.map(async (t) => {
        const owner = await db.get(t.ownerId)
        return { ...t, owner }
      })
    )
  }
)
