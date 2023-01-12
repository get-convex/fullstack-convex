import { Id } from './_generated/dataModel'
import { mutation } from './_generated/server'

export default mutation(
  async (
    { db, auth },
    title: string,
    visibility: string,
    description?: string
  ) => {
    const identity = await auth.getUserIdentity()
    if (!identity) {
      throw new Error('Called createTicket without authentication present')
    }
    console.log(identity)
    const user = await db
      .query('users')
      .filter((q) => q.eq(q.field('tokenIdentifier'), identity.tokenIdentifier))
      .unique()

    if (!user) {
      throw new Error('User identity not found')
    }

    const ticket = {
      title,
      authorId: user._id,
      ownerId: user._id,
      visibility,
      description,
      status: 'new',
    }
    return await db.insert('tickets', ticket)
  }
)
