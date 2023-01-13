import { query } from './_generated/server'
import { Document } from './_generated/dataModel'
import { findUser } from './getCurrentUser'

export default query(async ({ db, auth }): Promise<Document[]> => {
  // If logged in, fetch the stored user to get ID for filtering
  const user = await findUser(db, auth)

  // Get all public tickets, even if not logged in
  // If user is logged in, also get their owned tickets
  const tickets = await db
    .query('tickets')
    .order('desc')
    .filter((q) =>
      user
        ? q.or(
            q.eq(q.field('visibility'), 'public'),
            q.eq(q.field('ownerId'), user._id)
          )
        : q.eq(q.field('visibility'), 'public')
    )
    .collect()

  // Join with owner details from users table
  return Promise.all(
    tickets.map(async (t) => {
      const owner = await db.get(t.ownerId)
      return { ...t, owner }
    })
  )
})
