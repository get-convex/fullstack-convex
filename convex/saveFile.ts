import { mutation } from './_generated/server'
import { findUser } from './getCurrentUser'
import { countResults } from './countTasks'
import { findByTask } from './getTask'

// Generate a short-lived upload URL to post a file to
export const generateUploadUrl = mutation(async ({ storage }) => {
  return await storage.generateUploadUrl()
})

// Save a new file document with the given storage ID
export default mutation(async ({ db, auth }, taskId, storageId, name, type) => {
  const user = await findUser(db, auth)
  if (!user) {
    throw new Error('Error saving file: User identity not found')
  }

  const file = { taskId, storageId, userId: user._id, name, type }
  await db.insert('files', file)

  // Update the denormalized comment count in the tasks table
  // (used for indexing to support ordering by comment count)
  const fileCount = await countResults(findByTask(db, taskId, 'files'))

  await db.patch(taskId, { fileCount })
})
