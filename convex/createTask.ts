import { mutation } from './_generated/server'
import { findUser, getTaskFromDoc } from './internal'
import type { NewTaskInfo } from '../types'

export default mutation(async (queryCtx, taskInfo: NewTaskInfo) => {
  const { db, auth } = queryCtx
  const { title, description, visibility, status, owner } = taskInfo
  const ownerIdString = owner && owner.id

  const user = await findUser(db, auth)
  if (!user?._id) {
    throw new Error('Error creating task: User identity not found')
  }

  if (ownerIdString && ownerIdString !== user._id.toString()) {
    // Should never happen, but just to double check
    throw new Error(
      'Error creating task: Current user and task owner do not match'
    )
  }

  // Generate a number for this task, by finding the most
  // recently created task's number and incrementing
  const lastCreatedTask = await db.query('tasks').order('desc').first()
  const number = lastCreatedTask ? lastCreatedTask.number + 1 : 1

  const ownerId = ownerIdString ? user._id : null
  const ownerName = ownerIdString ? user.name : null

  // Copy owner name (if any) and comment count (initally 0) into table
  // so that we can index on these to support ordering with pagination
  const taskId = await db.insert('tasks', {
    ownerId,
    ownerName,
    commentCount: 0,
    fileCount: 0,
    number,
    title,
    description,
    visibility,
    status,
    search: [title, description, ownerName].join(' '),
  })

  // Get the newly saved task document and convert to Task object
  const newTask = await db.get(taskId)
  if (!newTask) {
    // Should not happen, but just in case/to appease TS
    throw new Error('Unexpected error saving task')
  }

  return await getTaskFromDoc(queryCtx, newTask)
})
