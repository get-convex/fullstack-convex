import { findUser } from './getCurrentUser'
import { getTaskFromDocument } from './getTask'
import { mutation } from './_generated/server'
import type { NewTaskInfo } from '../types'

export default mutation(async (queryCtx, taskInfo: NewTaskInfo) => {
  const { db, auth } = queryCtx
  const user = await findUser(db, auth)

  if (!user) {
    throw new Error('Error creating task: User identity not found')
  }

  if (taskInfo.owner?.id && taskInfo.owner.id !== user._id.toString()) {
    // Should never happen, but just to double check
    throw new Error(
      'Error creating task: Current user and task owner do not match'
    )
  }

  // Generate a number for this task, by finding the most
  // recently created task's number and incrementing
  const lastCreatedTask = await db.query('tasks').order('desc').first()
  const number = lastCreatedTask ? lastCreatedTask.number + 1 : 1

  // Copy owner name (if any) and comment count (initally 0) into table
  // so that we can index on these to support ordering with pagination
  const taskId = await db.insert('tasks', {
    ownerId: taskInfo.owner ? user._id : null,
    ownerName: taskInfo.owner ? user.name : null,
    commentCount: 0,
    fileCount: 0,
    number,
    ...taskInfo,
  })

  // Get the newly saved task document and convert to Task object
  const newTask = await db.get(taskId)
  if (!newTask) {
    // Should not happen, but just in case/to appease TS
    throw new Error('Unexpected error saving task')
  }

  return await getTaskFromDocument(queryCtx, newTask)
})
