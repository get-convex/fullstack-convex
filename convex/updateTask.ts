import { mutation } from './_generated/server'
import { findUser, getTaskFromDoc } from './internal'
import { Id, Doc } from './_generated/dataModel'
import { Visibility, type Task } from '../types'

export default mutation(async (queryCtx, taskInfo: Partial<Task>) => {
  function throwUpdateError(message: string) {
    throw new Error(`Error updating task: ${message}, ${taskInfo}`)
  }

  const { db, auth } = queryCtx
  if (!taskInfo.id) {
    throwUpdateError('No task ID provided')
    return
  }
  const taskId = new Id('tasks', taskInfo.id)
  if (!taskId) {
    throwUpdateError('Could not create ID for this task')
  }

  if (taskInfo.visibility === Visibility.PRIVATE && !taskInfo.owner?.id) {
    // Client side validation should prevent this combination, but double check just in case
    throwUpdateError('Private tasks must have an owner')
  }

  const user = await findUser(db, auth)
  if (!user?._id) {
    throwUpdateError('User identity not found')
  } else if (taskInfo.owner && !(taskInfo.owner.id === user._id.toString())) {
    throwUpdateError('User identity does not match task owner')
  }

  const updatedInfo = { ...taskInfo } as Partial<Doc<'tasks'>>
  if (taskInfo.owner !== undefined) {
    updatedInfo.ownerId = taskInfo.owner && new Id('users', taskInfo.owner.id)
    updatedInfo.ownerName = taskInfo.owner && taskInfo.owner.name
    // Un-join user table data
    delete updatedInfo.owner
  }

  // Un-join data from comments & files tables
  delete updatedInfo.comments
  delete updatedInfo.files

  // Update this task in the db & retrieve the updated task document
  await db.patch(taskId, { ...updatedInfo })
  const updatedDoc = await db.get(taskId)
  if (!updatedDoc) {
    // Should never happen, here to appease TS
    throw new Error(`Task not found: ${taskId}`)
  }

  // Return updated Task object
  return await getTaskFromDoc(queryCtx, updatedDoc)
})
