import { DatabaseReader, QueryCtx } from './_generated/server'
import { Doc, DataModel } from './_generated/dataModel'
import {
  Comment,
  File,
  Status,
  SortKey,
  SortOrder,
  OWNER_VALUES,
  STATUS_VALUES,
} from '../fullstack/types'
import type { tTaskId } from './validators'
import type { FilterBuilder, NamedTableInfo } from 'convex/server'
import type { Auth, GenericTableInfo, OrderedQuery, Query } from 'convex/server'

export type FindTasksOptions = {
  statusFilter: Status[]
  ownerFilter: string[]
  sortKey: SortKey
  sortOrder: SortOrder
  searchTerm: string
}

type TaskTableInfo = NamedTableInfo<DataModel, 'tasks'>

// Find tasks that match the given search/filter terms
export function findMatchingTasks(
  db: DatabaseReader,
  user: Doc<'users'> | null,
  options?: FindTasksOptions
) {
  const statuses = options?.statusFilter || STATUS_VALUES
  const owners = options?.ownerFilter || OWNER_VALUES
  const searchTerm = options?.searchTerm || ''

  const filterByStatus = (q: FilterBuilder<TaskTableInfo>, status: number) =>
    // Match any of the given status values
    q.eq(q.field('status'), status)

  const filterByOwner = (q: FilterBuilder<TaskTableInfo>, label: string) => {
    // Match any of the selected owner categories ("Me", "Others", "Nobody")
    const ownerId = q.field('ownerId')
    const unowned = q.eq(ownerId, null)
    const mine = user ? q.eq(ownerId, user._id) : false
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

  // Since we use non-search indexes to sort, we can either
  // search or sort the results but not both. So if we
  // have a search term to match, we ignore sort options
  const searchedOrSorted = searchTerm
    ? tasks.withSearchIndex('search_all', (q) => q.search('search', searchTerm))
    : tasks
      .withIndex(`by_${options?.sortKey || SortKey.NUMBER}`)
      .order(options?.sortOrder || SortOrder.DESC)

  const filtered = searchedOrSorted.filter((q) =>
    q.and(
      q.or(...statuses.map((s) => filterByStatus(q, s))),
      q.or(...owners.map((o) => filterByOwner(q, o)))
    )
  )

  return filtered
}

// Find all comments/files associated with a given task
export function findByTask(
  db: DatabaseReader,
  taskId: tTaskId,
  table: 'comments' | 'files'
) {
  return db.query(table).withIndex('by_task', (q) => q.eq('taskId', taskId))
}

// Convert a Convex 'comments' Doc to a Comment object,
// joining with User object
export async function getCommentFromDoc(
  ctx: QueryCtx,
  c: Doc<'comments'>
): Promise<Comment> {
  const { _id: id, _creationTime: creationTime, userId, body } = c

  if (ctx.db.normalizeId('users', userId) === null)
    throw new Error(`internal.js: Invalid userId ${userId} for comment ${id}`)

  const authorDoc = await ctx.db.get(userId)
  if (!authorDoc) throw new Error(`Comment ${id} author not found: User ${userId} not found`)

  return {
    id: id.toString(),
    creationTime,
    body,
    author: getUserFromDoc(authorDoc),
  }
}

// Convert a Convex 'files' Doc to a File object,
// joining with User object and file metadata
export async function getFileFromDoc(
  { db, storage }: QueryCtx,
  f: Doc<'files'>
): Promise<File> {
  const { name, type, storageId, userId, _id } = f
  if (db.normalizeId('users', userId) === null)
    throw new Error(`internal.js: Invalid userId ${userId} for file ${_id}`)

  const authorDoc = await db.get(userId)
  if (!authorDoc) throw new Error('File author not found')
  const author = getUserFromDoc(authorDoc)
  const url = await storage.getUrl(storageId)
  if (!url)
    throw new Error(`Error loading file URL; does the file still exist? storage ID: ${storageId}`)

  const metadata = await storage.getMetadata(storageId)
  if (!metadata)
    throw new Error(`Error loading file metadata; does the file still exist? storageId: ${storageId}`)
  const { size } = metadata

  return {
    id: f._id.toString(),
    creationTime: f._creationTime,
    author,
    url,
    size,
    name,
    type,
  }
}

// Convert a Convex 'users' Doc to a User object
export function getUserFromDoc(authorDoc: Doc<'users'>) {
  return {
    id: authorDoc._id.toString(),
    name: authorDoc.name,
    pictureUrl: authorDoc.pictureUrl,
  }
}

// Convert a Convex 'tasks' Doc to a Task object
export async function getTaskFromDoc(
  queryCtx: QueryCtx,
  taskDoc: Doc<'tasks'>
) {
  const { db } = queryCtx

  const {
    _id,
    _creationTime: creationTime,
    ownerId,
    number,
    title,
    description,
    status,
  } = taskDoc

  const task = {
    id: _id.toString(),
    creationTime,
    number,
    title,
    description,
    status,
  }

  // Join with users table
  if (!(ownerId === null) && db.normalizeId('users', ownerId) === null)
    throw new Error(
      `internal.js: Invalid ownerId ${ownerId}, type ${typeof ownerId}, for task ${number} ${_id}`
    )
  const ownerDoc = ownerId ? await db.get(ownerId) : null
  const owner = ownerDoc ? getUserFromDoc(ownerDoc) : ownerDoc

  // Join with comments table

  const commentsByTask = (await findByTask(
    db,
    _id,
    'comments'
  ).collect()) as Doc<'comments'>[]

  const comments = (await Promise.all(
    commentsByTask.map(async (c) => await getCommentFromDoc(queryCtx, c))
  )) as Comment[]

  // Join with files table

  const filesByTask = (await findByTask(
    db,
    _id,
    'files'
  ).collect()) as Doc<'files'>[]

  const files = (await Promise.all(
    filesByTask.map(async (f) => await getFileFromDoc(queryCtx, f))
  )) as File[]

  return { ...task, owner, comments, files }
}

// Get the currently authenticated user, if any
export async function findUser(
  db: DatabaseReader,
  auth: Auth
): Promise<Doc<'users'> | null> {
  const identity = await auth.getUserIdentity()
  if (!identity) return null
  return await db
    .query('users')
    .withIndex('by_tokenIdentifier', (q) =>
      q.eq('tokenIdentifier', identity?.tokenIdentifier)
    )
    .unique()
}

// Count the number of results returned by a particular query
export async function countResults(
  query: OrderedQuery<GenericTableInfo> | Query<GenericTableInfo>
) {
  // If we don't actually care about the task documents, rather
  // than calling .collect() we run through the iterator directly
  let count = 0
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const _ of query) {
    count++
  }
  return count
}
