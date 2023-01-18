import { findUser } from './getCurrentUser'
import { Document, Id } from './_generated/dataModel'
import { mutation } from './_generated/server'

export default mutation(
  async ({ db, auth }, taskId: Id, taskInfo: Partial<Document>) => {
    const user = await findUser(db, auth)

    if (!user) {
      throw new Error('Error updating task: User identity not found')
    }

    return await db.patch(taskId, taskInfo)
  }
)
