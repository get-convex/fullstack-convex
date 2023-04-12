import { mutation } from './_generated/server'
import { findUser, getTaskFromDoc } from './internal'
import { Id } from './_generated/dataModel'
import { Visibility, type Task } from '../types'

interface TaskInfo extends Partial<Task> {
  search?: string
}

export default mutation(async (queryCtx, taskInfo: TaskInfo) => {
  const { db, auth } = queryCtx
  if (!taskInfo.id) {
    throw new Error('Error updating task: Task ID not found')
  }
  const taskId = new Id('tasks', taskInfo.id)
  if (!taskId) {
    throw new Error('Error updating task: Task ID not found')
  }
  console.log(taskId, taskInfo)

  if (taskInfo.visibility === Visibility.PRIVATE && !taskInfo.owner?.id) {
    // Client side validation should prevent this combination, but double check just in case
    throw new Error('Error updating task: Private tasks must have an owner')
  }

  const user = await findUser(db, auth)
  console.log(user)
  if (!user) {
    throw new Error('Error updating task: User identity not found')
  }

  // const { title, description } = taskInfo
  // if (title || description) {
  //   const ownerName = taskInfo.owner?.name || ''
  //   const commentText = taskInfo.comments?.map((c) => c.body) || ''
  //   taskInfo.search = [title, description, ownerName, commentText].join(' ')
  //   console.log(taskId, typeof taskId, taskInfo.search)
  // }

  // Un-join data from users, comments, & files tables
  delete taskInfo.owner
  delete taskInfo.comments
  delete taskInfo.files
  delete taskInfo.id

  // Update this task in the db & retrieve the updated task document
  const patched = await db.patch(taskId, taskInfo)
  console.log(patched, taskId)
  const updatedDoc = await db.get(taskId)
  if (!updatedDoc) throw new Error('Task not found') // Should never happen, here to appease TS

  // Return updated Task object
  return await getTaskFromDoc(queryCtx, updatedDoc)
})
