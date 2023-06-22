import { mutation } from './_generated/server'
import { findUser, findByTask, countResults } from './internal'
import { Id } from './_generated/dataModel'

export default mutation(
  async ({ db, auth, storage }, { fileId }: { fileId: Id<'files'> }) => {
    const id = db.normalizeId('files', fileId)
    if (id === null)
      throw new Error(`Could not delete file: Invalid fileId ${fileId}`)
    const fileDoc = await db.get(id)
    if (!fileDoc) throw new Error('Could not delete file: file not found')
    const { taskId, userId } = fileDoc

    const user = await findUser(db, auth)
    if (!user)
      throw new Error('Could not delete file: User is not authenticated')

    if (user._id !== userId)
      throw new Error(
        'Could not delete file: Current user does not match file author'
      )

    await storage.delete(fileDoc.storageId)
    await db.delete(id)

    // Update the denormalized file count for this task (for sorting)
    const fileCount = await countResults(findByTask(db, taskId, 'files'))
    await db.patch(taskId, { fileCount })
    return null
  }
)
