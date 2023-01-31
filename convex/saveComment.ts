import { Id } from './_generated/dataModel'
import { mutation } from './_generated/server'
import { findUser } from './getCurrentUser'

export default mutation(async ({ db, auth }, taskId: Id, body: string) => {
  const user = await findUser(db, auth)

  if (!user) {
    throw new Error('Error saving comment: User identity not found')
  }

  const comment = { taskId, userId: user._id, body }
  await db.insert('comments', comment)
})
