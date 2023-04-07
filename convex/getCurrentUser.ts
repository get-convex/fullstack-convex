import { query } from './_generated/server'
import { findUser } from './internal'
import type { User } from '../types'

export default query(async ({ db, auth }) => {
  const userDoc = await findUser(db, auth)
  if (!userDoc) return Promise.resolve(null)

  return Promise.resolve({
    id: userDoc._id.toString(),
    creationTime: userDoc._creationTime,
    name: userDoc.name,
    pictureUrl: userDoc.pictureUrl,
  } as User)
})
