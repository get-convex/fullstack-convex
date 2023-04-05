import { query } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import type { DatabaseReader } from './_generated/server'
import type { Auth } from 'convex/server'
import type { User } from '../types'

export async function findUser(
  db: DatabaseReader,
  auth: Auth
): Promise<Doc<'users'> | null> {
  // Expose this as its own function for reusability in other queries/mutations
  const identity = await auth.getUserIdentity()
  if (!identity) return null
  return await db
    .query('users')
    .withIndex('by_tokenIdentifier', (q) =>
      q.eq('tokenIdentifier', identity?.tokenIdentifier)
    )
    .unique()
}

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
