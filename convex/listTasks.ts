import { query, type DatabaseReader } from './_generated/server'
import { findUser } from './getCurrentUser'
import { getTaskFromDocument } from './getTask'
import {
  Visibility,
  Status,
  SortKey,
  SortOrder,
  TaskListOptions,
} from '../types'
import type { Document } from './_generated/dataModel'
import type { PaginationOptions } from 'convex/server'

// Expose this as its own function for reusability in other queries
export function findMatchingTasks(
  db: DatabaseReader,
  user: Document<'users'> | null,
  {
    filter = {
      status: {
        selected: [Status.New, Status['In Progress']],
        onChange: () => null,
      },
      owner: { selected: ['Anyone'], onChange: () => null },
    },
    sort = {
      key: SortKey.NUMBER,
      order: SortOrder.ASC,
      onChange: () => null,
    },
  }: TaskListOptions
) {
  return db
    .query('tasks')
    .withIndex(`by_${sort.key}`)
    .order(sort.order)
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
          ...filter.status.selected.map((status: number) =>
            q.eq(q.field('status'), status)
          )
        ),
        q.or(
          ...filter.owner.selected.map((key: string) => {
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
    queryOptions: TaskListOptions
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
        page.map(
          async (taskDoc) => await getTaskFromDocument(queryCtx, taskDoc)
        )
      ),
      isDone,
      continueCursor,
    }
  }
)
