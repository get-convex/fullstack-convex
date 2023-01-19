import { findUser } from './getCurrentUser'
import { Document, Id } from './_generated/dataModel'
import { mutation } from './_generated/server'

export default mutation(async ({ db, auth }, taskInfo: Partial<Document>) => {
  const user = await findUser(db, auth)

  if (!user) {
    throw new Error('Error updating task: User identity not found')
  }

  const taskId = taskInfo._id
  if (!taskId) {
    throw new Error('Error updating task: Task ID not found')
  }

  await db.patch(taskId, taskInfo)
  return await db.get(taskId)
})
