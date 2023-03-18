import { findUser } from './getCurrentUser'
import { mutation } from './_generated/server'
import { Visibility } from './schema'
import type { Task } from './getTask'

export default mutation(async ({ db, auth }, taskInfo: Partial<Task>) => {
  const user = await findUser(db, auth)

  if (!user) {
    throw new Error('Error updating task: User identity not found')
  }

  const taskId = taskInfo._id
  if (!taskId) {
    throw new Error('Error updating task: Task ID not found')
  }

  if (taskInfo.visibility === Visibility.PRIVATE && !taskInfo.ownerId) {
    // Client side validation should prevent this combination, but double check just in case
    throw new Error('Error updating task: Private tasks must have an owner')
  }

  await db.patch(taskId, taskInfo)
  const task = await db.get(taskId)
  if (!task) throw new Error('Task not found') // Should never happen, here to appease TS
  return task
})
