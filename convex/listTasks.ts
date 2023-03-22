import { query, type DatabaseReader } from './_generated/server'
import { findUser } from './getCurrentUser'
import { Visibility } from './schema'
import { Status, SortKey, SortOrder } from './schema'
import type { Document } from './_generated/dataModel'

export interface ListTasksOptions {
  statusFilter?: Status[]
  ownerFilter?: string[]
  sortKey?: SortKey
  sortOrder?: SortOrder
}

// Expose this as its own function for reusability in other queries
export function findMatchingTasks(
  db: DatabaseReader,
  user: Document<'users'> | null,
  {
    statusFilter = [Status.New, Status['In Progress']],
    ownerFilter = ['Anyone'],
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
        ),
        q.or(
          ...ownerFilter.map((key: string) => {
            const ownerId = q.field('ownerId')
            const unowned = q.eq(ownerId, null)
            const mine = user ? q.eq(q.field('ownerId'), user._id) : false
            switch (key) {
              case 'Nobody':
                return unowned
              case 'Others':
                return q.and(q.not(unowned), q.not(mine))
              case 'Me':
                return mine
              default:
                return false
            }
          })
        )
      )
    )
}

export default query(
  async ({ db, auth }, paginationOptions, queryOptions: ListTasksOptions) => {
    // If logged in, fetch the stored user to get ID for filtering
    const user = await findUser(db, auth)
    console.log(queryOptions)

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
  }
)
