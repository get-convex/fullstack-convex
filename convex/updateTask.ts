import { mutation } from './_generated/server'
import { findUser, getTaskFromDoc } from './internal'
import { Id } from './_generated/dataModel'
import { Visibility, type Task } from '../types'

export default mutation(async (queryCtx, taskInfo: Partial<Task>) => {
  const { db, auth } = queryCtx
  if (!taskInfo.id) {
    throw new Error('Error updating task: Task ID not found')
  }
  const taskId = new Id('tasks', taskInfo.id)
  if (!taskId) {
    throw new Error('Error updating task: Task ID not found')
  }

  if (taskInfo.visibility === Visibility.PRIVATE && !taskInfo.owner?.id) {
    // Client side validation should prevent this combination, but double check just in case
    throw new Error('Error updating task: Private tasks must have an owner')
  }

  const user = await findUser(db, auth)
  if (!user) {
    throw new Error('Error updating task: User identity not found')
  }

  // Un-join data from users, comments, & files tables
  delete taskInfo.owner
  delete taskInfo.comments
  delete taskInfo.files

  // Update this task in the db & retrieve the updated task document
  await db.patch(taskId, taskInfo)
  const updatedDoc = await db.get(taskId)
  if (!updatedDoc) throw new Error('Task not found') // Should never happen, here to appease TS

  // Return updated Task object
  return await getTaskFromDoc(queryCtx, updatedDoc)
})
