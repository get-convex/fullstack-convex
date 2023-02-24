import { query, type DatabaseReader } from './_generated/server'
import type { Document, Id } from './_generated/dataModel'

export interface FileAttachment extends Document<'files'> {
  author: Document<'users'>
  url: string
  size: number
}

// Expose this as its own function for reusability in other queries
export function findFilesByTask(db: DatabaseReader, taskId: Id<'tasks'>) {
  return db.query('files').withIndex('by_task', (q) => q.eq('taskId', taskId))
}

export default query(async ({ db, storage }, taskId: Id<'tasks'>) => {
  const files = await findFilesByTask(db, taskId).collect()

  // Join with author details from users table
  return Promise.all(
    files.map(async (f) => {
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
  )
})
