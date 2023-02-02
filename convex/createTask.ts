import { findUser } from './getCurrentUser'
import { mutation } from './_generated/server'
import type { Task } from './getTask'

export default mutation(async ({ db, auth }, taskInfo: Task) => {
  const user = await findUser(db, auth)

  if (!user) {
    throw new Error('Error creating task: User identity not found')
  }

  // Generate a number for this task, by finding the most
  // recently created task's number and incrementing
  const lastCreatedTask = await db.query('tasks').order('desc').first()
  const number = lastCreatedTask ? lastCreatedTask.number + 1 : 1

  const taskId = await db.insert('tasks', {
    ...taskInfo,
    number,
  })

  const task = await db.get(taskId)
  if (!task) throw new Error('Task not found') // Should never happen, here to appease TS
  return task
})
