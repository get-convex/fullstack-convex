import { query, type DatabaseReader } from './_generated/server'
import { Visibility } from './schema'
import type { Comment, File } from '../types'
import type { Id, Document } from './_generated/dataModel'

// Expose this as its own function for reusability in other queries
export function findByTask(
  db: DatabaseReader,
  taskId: Id<'tasks'>,
  table: 'comments' | 'files'
) {
  return db.query(table).withIndex('by_task', (q) => q.eq('taskId', taskId))
}

function getUserFromDocument(authorDoc: Document<'users'>) {
  return {
    id: authorDoc._id.toString(),
    name: authorDoc.name,
    pictureUrl: authorDoc.pictureUrl,
  }
}

export default query(
  async ({ db, auth, storage }, taskNumber: number | 'new' | null) => {
    if (!taskNumber || typeof taskNumber !== 'number') return null

    const identity = await auth.getUserIdentity()
    const taskDoc = await db
      .query('tasks')
      .withIndex('by_number', (q) => q.eq('number', taskNumber))
      .unique()
    if (!taskDoc) return null

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

    // Join with users table
    const owner = ownerId && (await db.get(ownerId))

    if (task.visibility === Visibility.PRIVATE) {
      if (!identity) throw new Error('You must be logged in to view this task')
      if (identity.tokenIdentifier !== owner?.tokenIdentifier)
        throw new Error('You do not have permission to view this task')
    }

    // Join with comments table
    const commentsByTask = await findByTask(db, _id, 'comments').collect()
    const comments = (await Promise.all(
      commentsByTask.map(async (c) => {
        const authorDoc = await db.get(c.userId)
        if (!authorDoc) throw new Error('Comment author not found')

        return {
          id: c._id.toString(),
          creationTime: c.creationTime,
          body: c.body,
          author: getUserFromDocument(authorDoc),
        }
      })
    )) as Comment[]

    // Join with files table
    const filesByTask = await findByTask(db, _id, 'files').collect()
    const files = (await Promise.all(
      filesByTask.map(async (f) => {
        const authorDoc = await db.get(f.userId)
        if (!authorDoc) throw new Error('File author not found')
        const author = getUserFromDocument(authorDoc)
        const url = await storage.getUrl(f.storageId)
        if (!url)
          throw new Error('Error loading file URL; does the file still exist?')

        const metadata = await storage.getMetadata(f.storageId)
        if (!metadata)
          throw new Error(
            'Error loading file metadata; does the file still exist?'
          )
        const { size } = metadata

        return { id: f._id.toString(), author, url, size }
      })
    )) as File[]

    return { ...task, owner, comments, files }
  }
)
