import { query } from './_generated/server'
import { Document } from './_generated/dataModel'
import {
  DatabaseReader,
  Auth,
  AnyDataModel,
} from 'convex/dist/types/server/server'

export async function findUser(db: DatabaseReader<AnyDataModel>, auth: Auth) {
  // Expose this as its own function for reusability in other queries/mutations
  const identity = await auth.getUserIdentity()
  return await db
    .query('users')
    .filter((q) => q.eq(q.field('tokenIdentifier'), identity?.tokenIdentifier))
    .unique()
}

export default query(async ({ db, auth }): Promise<Document> => {
  return await findUser(db, auth)
})
