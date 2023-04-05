import { mutation } from './_generated/server'
import { findUser } from './getCurrentUser'
import { countResults } from './countTasks'
import { findByTask, getFileFromDoc } from './getTask'

// Generate a short-lived upload URL to post a file to
export const generateUploadUrl = mutation(async ({ storage }) => {
  return await storage.generateUploadUrl()
})

// Save a new file document with the given storage ID
export default mutation(async (queryCtx, taskId, file: globalThis.File) => {
  const { db, auth } = queryCtx
  const user = await findUser(db, auth)
  if (!user) {
    throw new Error('Error saving file: User identity not found')
  }
  const { name, type } = file

  const fileInfo = { taskId, storageId: '', userId: user._id, name, type } //TODO storageId
  const fileId = await db.insert('files', fileInfo)

  // Update the denormalized comment count in the tasks table
  // (used for indexing to support ordering by comment count)
  const fileCount = await countResults(findByTask(db, taskId, 'files'))

  await db.patch(taskId, { fileCount })

  const fileDoc = await db.get(fileId)
  if (!fileDoc) {
    // Should never happen
    throw new Error('Unexpected error saving file!')
  }
  return await getFileFromDoc(queryCtx, fileDoc)

  //TODO return something useful, File obj?
})
