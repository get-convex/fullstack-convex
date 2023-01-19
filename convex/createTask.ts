import { findUser } from './getCurrentUser'
import { mutation } from './_generated/server'

export default mutation(async ({ db, auth }, taskInfo: Partial<Document>) => {
  const user = await findUser(db, auth)

  if (!user) {
    throw new Error('Error creating task: User identity not found')
  }

  // Generate a number for this task, by finding the most
  // recently created task's number and incrementing
  const lastCreatedTask = await db.query('tasks').order('desc').first()
  const number = lastCreatedTask ? lastCreatedTask.number + 1 : 1

  const task = {
    ownerId: user._id,
    number,
    ...taskInfo,
  }
  const taskId = await db.insert('tasks', task)
  return await db.get(taskId)
})
