import { query } from './_generated/server'
import { Document } from './_generated/dataModel'
import { findUser } from './getCurrentUser'

export default query(
  async ({ db, auth }, paginationOptions, statusFilter: string[]) => {
    // If logged in, fetch the stored user to get ID for filtering
    const user = await findUser(db, auth)

    const { page, isDone, continueCursor } = await db
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
      .paginate(paginationOptions)

    return {
      page: await Promise.all(
        // Join each task with owner details from users table
        page.map(async (task) => {
          const owner = task.ownerId && (await db.get(task.ownerId))
          return { ...task, owner }
        })
      ),
      isDone,
      continueCursor,
    }
  }
)
