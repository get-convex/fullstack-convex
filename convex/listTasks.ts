import { query, type DatabaseReader } from './_generated/server'
import { findUser } from './getCurrentUser'
import type { Document } from './_generated/dataModel'
import { Visibility } from './schema'
import { Task } from './getTask'
import { Status, SortKey, SortOrder } from './schema'

export interface ListedTask extends Task {
  comments: number
}

export interface ListTasksOptions {
  statusFilter?: Status[]
  sortKey?: SortKey
  sortOrder?: SortOrder
}

// Expose this as its own function for reusability in other queries
export function findMatchingTasks(
  db: DatabaseReader,
  user: Document<'users'> | null,
  {
    statusFilter = [Status.New, Status['In Progress']],
    sortKey = SortKey.NUMBER,
    sortOrder = SortOrder.ASC,
  }: ListTasksOptions
) {
  return db
    .query('tasks')
    .withIndex(`by_${sortKey}`)
    .order(sortOrder)
    .filter((q) =>
      q.and(
        user
          ? // Logged in users see their private tasks as well as public
            q.or(
              q.eq(q.field('visibility'), Visibility.PUBLIC),
              q.eq(q.field('ownerId'), user._id)
            )
          : // Logged out users only see public tasks
            q.eq(q.field('visibility'), Visibility.PUBLIC),
        q.or(
          // Match any of the given status values
          ...statusFilter.map((status: number) =>
            q.eq(q.field('status'), status)
          )
        )
      )
    )
}

export default query(async ({ db, auth }, paginationOptions, queryOptions) => {
  // If logged in, fetch the stored user to get ID for filtering
  const user = await findUser(db, auth)

  const { page, isDone, continueCursor } = await findMatchingTasks(
    db,
    user,
    queryOptions
  ).paginate(paginationOptions)

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
})
