import { query } from './_generated/server'
import { Visibility } from './schema'
import type { Document, Id } from './_generated/dataModel'
import type { DatabaseReader } from './_generated/server'
import type { Auth, StorageReader } from 'convex/server'

export interface Comment extends Document<'comments'> {
  author: Document<'users'>
}

export interface File extends Document<'files'> {
  author: Document<'users'>
  url: string
  size: number
}

export interface Task extends Document<'tasks'> {
  owner: Document<'users'> | null
  comments: Comment[]
  files: File[]
}

// Expose these functions for reusability in other queries
export function findByTask(
  db: DatabaseReader,
  taskId: Id<'tasks'>,
  table: 'comments' | 'files'
) {
  return db.query(table).withIndex('by_task', (q) => q.eq('taskId', taskId))
}

export async function getTaskDetails(
  {
    db,
    auth,
    storage,
  }: { db: DatabaseReader; auth: Auth; storage: StorageReader },
  task: Document<'tasks'>
) {
  const identity = await auth.getUserIdentity()

  // Join with users table
  const owner = task.ownerId && (await db.get(task.ownerId))

  if (task.visibility === Visibility.PRIVATE) {
    if (!identity) throw new Error('You must be logged in to view this task')
    if (identity.tokenIdentifier !== owner?.tokenIdentifier)
      throw new Error('You do not have permission to view this task')
  }

  // Join with comments table
  const commentsByTask = await findByTask(db, task._id, 'comments').collect()
  const comments = (await Promise.all(
    commentsByTask.map(async (c) => {
      const author = await db.get(c.userId)
      if (!author) throw new Error('Comment author not found')
      return { ...c, author }
    })
  )) as Comment[]

  // Join with files table
  const filesByTask = await findByTask(db, task._id, 'files').collect()
  const files = (await Promise.all(
    filesByTask.map(async (f) => {
      const author = await db.get(f.userId)
      if (!author) throw new Error('File author not found')

      const url = await storage.getUrl(f.storageId)
      if (!url)
        throw new Error('Error loading file URL; does the file still exist?')

      const metadata = await storage.getMetadata(f.storageId)
      if (!metadata)
        throw new Error(
          'Error loading file metadata; does the file still exist?'
        )
      const { size } = metadata

      return { ...f, author, url, size }
    })
  )) as File[]

  return { ...task, owner, comments, files }
}

export default query(async (ctx, taskNumber: number | 'new' | null) => {
  if (!taskNumber || typeof taskNumber !== 'number') return null

  const task = await ctx.db
    .query('tasks')
    .withIndex('by_number', (q) => q.eq('number', taskNumber))
    .unique()
  if (!task) return null

  return await getTaskDetails(ctx, task)
})
