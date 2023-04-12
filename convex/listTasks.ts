import { query, type DatabaseReader } from './_generated/server'
import { findUser, getTaskFromDoc } from './internal'
import {
  Visibility,
  Status,
  SortKey,
  SortOrder,
  OWNER_VALUES,
  STATUS_VALUES,
} from '../types'
import type { DataModel, Doc } from './_generated/dataModel'
import type {
  PaginationOptions,
  FilterBuilder,
  NamedTableInfo,
} from 'convex/server'

export type FindTasksOptions = {
  statusFilter: Status[]
  ownerFilter: string[]
  sortKey: SortKey
  sortOrder: SortOrder
  searchTerm: string
}

type TaskTableInfo = NamedTableInfo<DataModel, 'tasks'>

// Expose this as its own function for reusability in other queries
export function findMatchingTasks(
  db: DatabaseReader,
  user: Doc<'users'> | null,
  options?: FindTasksOptions
) {
  const statuses = options?.statusFilter || STATUS_VALUES
  const owners = options?.ownerFilter || OWNER_VALUES
  const searchTerm = options?.searchTerm || ''

  const filterByUser = (q: FilterBuilder<TaskTableInfo>) =>
    user
      ? // Logged in users see their private tasks as well as public
        q.or(
          q.eq(q.field('visibility'), Visibility.PUBLIC),
          q.eq(q.field('ownerId'), user._id)
        )
      : // Logged out users only see public tasks
        q.eq(q.field('visibility'), Visibility.PUBLIC)

  const filterByStatus = (q: FilterBuilder<TaskTableInfo>, status: number) =>
    // Match any of the given status values
    q.eq(q.field('status'), status)

  const filterByOwner = (q: FilterBuilder<TaskTableInfo>, label: string) => {
    // Match any of the selected owner categories ("Me", "Others", "Nobody")
    const ownerId = q.field('ownerId')
    const unowned = q.eq(ownerId, null)
    const mine = user ? q.eq(q.field('ownerId'), user._id) : false
    switch (label) {
      case 'Nobody':
        return unowned
      case 'Others':
        return q.and(q.not(unowned), q.not(mine))
      case 'Me':
        return mine
      default:
        return false
    }
  }

  const tasks = db.query('tasks')

  const searchedOrSorted = searchTerm
    ? tasks.withSearchIndex('search_title', (q) =>
        q.search('title', searchTerm)
      )
    : tasks
        .withIndex(`by_${options?.sortKey || SortKey.NUMBER}`)
        .order(options?.sortOrder || SortOrder.DESC)

  const filtered = searchedOrSorted.filter((q) =>
    q.and(
      filterByUser(q),
      q.or(...statuses.map((s) => filterByStatus(q, s))),
      q.or(...owners.map((o) => filterByOwner(q, o)))
    )
  )

  return filtered
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
