import { query, type DatabaseReader } from './_generated/server'
import { findUser } from './getCurrentUser'
import { getTaskFromDoc } from './getTask'
import { Visibility, Status, SortKey, SortOrder, OWNER_VALUES } from '../types'
import type { Doc } from './_generated/dataModel'
import type { PaginationOptions } from 'convex/server'

export type FindTasksOptions = {
  statusFilter: Status[]
  ownerFilter: string[]
  sortKey: SortKey
  sortOrder: SortOrder
}

// Expose this as its own function for reusability in other queries
export function findMatchingTasks(
  db: DatabaseReader,
  user: Doc<'users'> | null,
  options?: FindTasksOptions
) {
  const statuses = options?.statusFilter || [Status.New, Status['In Progress']]
  const owners = options?.ownerFilter || OWNER_VALUES

  return db
    .query('tasks')
    .withIndex(`by_${options?.sortKey || SortKey.NUMBER}`)
    .order(options?.sortOrder || SortOrder.DESC)
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
          ...statuses.map((status: number) => q.eq(q.field('status'), status))
        ),
        q.or(
          ...owners.map((key: string) => {
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
  async (
    queryCtx,
    paginationOptions: PaginationOptions,
    queryOptions: FindTasksOptions
  ) => {
    const { db, auth } = queryCtx
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
        page.map(async (taskDoc) => await getTaskFromDoc(queryCtx, taskDoc))
      ),
      isDone,
      continueCursor,
    }
  }
)
