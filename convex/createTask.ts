import { findUser } from './getCurrentUser'
import { mutation } from './_generated/server'
import { getTaskDetails } from './getTask'
import type { Task } from './getTask'

export default mutation(async (ctx, taskInfo: Task) => {
  const { db, auth } = ctx
  const user = await findUser(db, auth)

  if (!user) {
    throw new Error('Error creating task: User identity not found')
  }

  if (taskInfo.ownerId && !taskInfo.ownerId.equals(user._id)) {
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
    ...taskInfo,
    number,
    ownerName: taskInfo.ownerId ? user.name : null,
    comments: 0,
  })

  const task = await db.get(taskId)
  if (!task) throw new Error('Task not found') // Should never happen, here to appease TS
  const taskDetails = await getTaskDetails(ctx, task)
  return taskDetails
})
