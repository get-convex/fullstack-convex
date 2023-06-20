import { query, type DatabaseReader } from './_generated/server';

export async function findUsersByName(db: DatabaseReader, name: string) {
  return await db
    .query('users')
    .filter((q) => q.eq(q.field('name'), name))
    .collect()
}

export default query(async ({ db }) => {
  return await db.query('users').collect()
})
