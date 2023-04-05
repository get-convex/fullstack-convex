import { mutation } from './_generated/server'
import { findUser } from './getCurrentUser'
import { Id } from './_generated/dataModel'

export default mutation(async ({ db, auth, storage }, fileId: Id<'files'>) => {
  const file = await db.get(fileId)
  if (!file) throw new Error('Could not delete file: file not found')

  const user = await findUser(db, auth)
  if (!user) throw new Error('Could not delete file: User is not authenticated')

  if (!user._id.equals(file.userId))
    throw new Error(
      'Could not delete file: Current user does not match file author'
    )

  await storage.delete(file.storageId)
  await db.delete(fileId)
  return null
})
