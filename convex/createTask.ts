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

    const task = {
      title,
      ownerId: user._id,
      visibility,
      description,
      status: 'New',
    }
    return await db.insert('tasks', task)
  }
)
