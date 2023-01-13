import { findUser } from './getCurrentUser'
import { Id } from './_generated/dataModel'
import { mutation } from './_generated/server'

export default mutation(
  async (
    { db, auth },
    title: string,
    visibility: string,
    description?: string
  ) => {
    const user = await findUser(db, auth)

    if (!user) {
      throw new Error('Error creating task: User identity not found')
    }

    // Generate a number for this task, by finding the most
    // recently created task's number and incrementing
    const lastCreatedTask = await db.query('tasks').order('desc').first()
    const number = lastCreatedTask ? lastCreatedTask.number + 1 : 1

    const task = {
      title,
      ownerId: user._id,
      visibility,
      description,
      status: 'New',
      number,
    }
    const id = await db.insert('tasks', task)
    return { id, number }
  }
)
