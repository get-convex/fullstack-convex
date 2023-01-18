import { query } from './_generated/server'
import { Document } from './_generated/dataModel'
import {
  DatabaseReader,
  Auth,
  AnyDataModel,
} from 'convex/dist/types/server/server'

export async function findUsersByName(
  db: DatabaseReader<AnyDataModel>,
  name: string
) {
  return await db
    .query('users')
    .filter((q) => q.eq(q.field('name'), name))
    .collect()
}

export default query(async ({ db }): Promise<Document> => {
  return await db.query('users').collect()
})
