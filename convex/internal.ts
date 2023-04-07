import {
  internalQuery,
  internalMutation,
  DatabaseReader,
  QueryCtx,
  mutation,
} from './_generated/server'
import { Comment, File, Visibility } from '../types'
import type { Doc, Id } from './_generated/dataModel'
import type { Auth, GenericTableInfo, OrderedQuery, Query } from 'convex/server'

type FileDocInfo = {
  type: string
  name: string
  taskId: Id<'tasks'>
  userId: Id<'users'>
  storageId: string
}

// Find all comments/files associated with a given task
export function findByTask(
  db: DatabaseReader,
  taskId: Id<'tasks'>,
  table: 'comments' | 'files'
) {
  return db.query(table).withIndex('by_task', (q) => q.eq('taskId', taskId))
}

// Convert a Convex 'comments' Doc to a Comment object,
// joining with User object
export async function getCommentFromDoc(
  { db }: QueryCtx,
  c: Doc<'comments'>
): Promise<Comment> {
  const { _id: id, _creationTime: creationTime, userId, body } = c
  const authorDoc = await db.get(userId)
  if (!authorDoc) throw new Error('Comment author not found')

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
  const { name, type, storageId, userId } = f
  const authorDoc = await db.get(userId)
  if (!authorDoc) throw new Error('File author not found')
  const author = getUserFromDoc(authorDoc)
  const url = await storage.getUrl(storageId)
  if (!url)
    throw new Error('Error loading file URL; does the file still exist?')

  const metadata = await storage.getMetadata(storageId)
  if (!metadata)
    throw new Error('Error loading file metadata; does the file still exist?')
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
  const { db, auth } = queryCtx

  const {
    _id,
    _creationTime: creationTime,
    ownerId,
    number,
    title,
    description,
    visibility,
    status,
  } = taskDoc

  const task = {
    id: _id.toString(),
    creationTime,
    number,
    title,
    description,
    visibility,
    status,
  }

  // Find the currently logged in user's identity (if any)
  const identity = await auth.getUserIdentity()

  // Join with users table
  const owner = ownerId && (await db.get(ownerId))

  if (task.visibility === Visibility.PRIVATE) {
    if (!identity) throw new Error('You must be logged in to view this task')
    if (identity.tokenIdentifier !== owner?.tokenIdentifier)
      throw new Error('You do not have permission to view this task')
  }

  // Join with comments table
  const commentsByTask = (await findByTask(
    db,
    _id,
    'comments'
  ).collect()) as Doc<'comment'>[]
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

// Generate a short-lived upload URL to post a file to
export const getUploadUrl = internalMutation(async ({ storage }) => {
  return await storage.generateUploadUrl()
})

// Save a new file document with the given storage ID
export const saveFileDoc = mutation(
  async (mutCtx, taskId: Id<'tasks'>, fileInfo: FileDocInfo) => {
    const { db, auth } = mutCtx
    const user = await findUser(db, auth)
    if (!user) {
      throw new Error('Error saving file: User identity not found')
    }

    const fileId = await db.insert('files', fileInfo)

    // Update the denormalized comment count in the tasks table
    // (used for indexing to support ordering by comment count)
    const fileCount = await countResults(findByTask(db, taskId, 'files'))

    await db.patch(taskId, { fileCount })
    return fileId
  }
)

// Retrieve a File object from a given
export const getFileById = internalQuery(
  async (queryCtx, fileId: Id<'files'>): Promise<File | null> => {
    const fileDoc = await queryCtx.db.get(fileId)
    if (!fileDoc) return null
    return await getFileFromDoc(queryCtx, fileDoc)
  }
)
