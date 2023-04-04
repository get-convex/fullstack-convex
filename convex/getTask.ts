import { query } from './_generated/server'
import { Visibility, Comment, File } from '../types'
import type { Id, Document } from './_generated/dataModel'
import type { QueryCtx, DatabaseReader } from './_generated/server'

// Expose this as its own function for reusability in other queries
export function findByTask(
  db: DatabaseReader,
  taskId: Id<'tasks'>,
  table: 'comments' | 'files'
) {
  return db.query(table).withIndex('by_task', (q) => q.eq('taskId', taskId))
}

export async function getCommentFromDocument(
  { db }: QueryCtx,
  c: Document<'comments'>
): Promise<Comment> {
  const authorDoc = await db.get(c.userId)
  if (!authorDoc) throw new Error('Comment author not found')

  return {
    id: c._id.toString(),
    creationTime: c._creationTime,
    body: c.body,
    author: getUserFromDocument(authorDoc),
  }
}

export async function getFileFromDocument(
  { db, storage }: QueryCtx,
  f: Document<'files'>
): Promise<File> {
  const { name, type, storageId, userId } = f
  const authorDoc = await db.get(userId)
  if (!authorDoc) throw new Error('File author not found')
  const author = getUserFromDocument(authorDoc)
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

export function getUserFromDocument(authorDoc: Document<'users'>) {
  return {
    id: authorDoc._id.toString(),
    name: authorDoc.name,
    pictureUrl: authorDoc.pictureUrl,
  }
}

export async function getTaskFromDocument(
  queryCtx: QueryCtx,
  taskDoc: Document<'tasks'>
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
  ).collect()) as Document<'comment'>[]
  const comments = (await Promise.all(
    commentsByTask.map(async (c) => await getCommentFromDocument(queryCtx, c))
  )) as Comment[]

  // Join with files table
  const filesByTask = (await findByTask(
    db,
    _id,
    'files'
  ).collect()) as Document<'files'>[]
  const files = (await Promise.all(
    filesByTask.map(async (f) => await getFileFromDocument(queryCtx, f))
  )) as File[]

  return { ...task, owner, comments, files }
}

export default query(async (queryCtx, taskNumber: number | 'new' | null) => {
  const { db } = queryCtx
  if (!taskNumber || typeof taskNumber !== 'number') return null

  const taskDoc = await db
    .query('tasks')
    .withIndex('by_number', (q) => q.eq('number', taskNumber))
    .unique()
  if (!taskDoc) return null

  return await getTaskFromDocument(queryCtx, taskDoc)
})
