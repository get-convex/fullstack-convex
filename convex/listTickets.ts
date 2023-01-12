import { query } from './_generated/server'
import { Document } from './_generated/dataModel'

export default query(async ({ db, auth }): Promise<Document[]> => {
  // If logged in, fetch the user ID for filtering
  const identity = await auth.getUserIdentity()
  const user = identity
    ? await db
        .query('users')
        .filter((q) =>
          q.eq(q.field('tokenIdentifier'), identity.tokenIdentifier)
        )
        .unique()
    : null

  // Get all public tickets, even if not logged in
  // If user is logged in, also get their owned tickets
  const tickets = await db
    .query('tickets')
    .filter((q) =>
      user
        ? q.or(
            q.eq(q.field('visibility'), 'public'),
            q.eq(q.field('ownerId'), user._id)
          )
        : q.eq(q.field('visibility'), 'public')
    )
    .collect()

  // Join with author/owner details from users table
  return Promise.all(
    tickets.map(async (t) => {
      const author = await db.get(t.authorId)
      const owner = await db.get(t.ownerId)
      return { ...t, author, owner }
    })
  )
})
