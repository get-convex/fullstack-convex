import { mutation } from './_generated/server'
import { findUser } from './getCurrentUser'

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
})
