import { query } from './_generated/server'
import { Document, Id } from './_generated/dataModel'

export default query(async ({ db, auth }, ticketId: Id): Promise<Document> => {
  const identity = await auth.getUserIdentity()
  const ticket = await db.get(ticketId)
  const author = await db.get(ticket.authorId)
  const owner = await db.get(ticket.ownerId)
  if (!ticket) return null
  if (ticket.visibility === 'private') {
    // TODO currently only logged-in users
    if (!identity) return { error: 'You must be logged in to view this ticket' }
    if (identity.tokenIdentifier !== owner.tokenIdentifier)
      return { error: 'You do not have permission to view this ticket' }
  }

  return { ...ticket, author, owner }
})
