import { query } from './_generated/server'
import type { Document } from './_generated/dataModel'
import type { DatabaseReader } from './_generated/server'
import type { Auth } from 'convex/server'

export async function findUser(
  db: DatabaseReader,
  auth: Auth
): Promise<Document<'users'> | null> {
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
  return await findUser(db, auth)
})
