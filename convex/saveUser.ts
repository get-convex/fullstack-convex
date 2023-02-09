import { mutation } from './_generated/server'
import type { Id } from './_generated/dataModel'

// Insert or update the user in a Convex table then return the document's ID.
//
// The `UserIdentity.tokenIdentifier` string is a stable and unique value we use
// to look up identities.
//
// Keep in mind that `UserIdentity` has a number of optional fields, the
// presence of which depends on the identity provider chosen. It's up to the
// application developer to determine which ones are available and to decide
// which of those need to be persisted.
export default mutation(async ({ db, auth }): Promise<Id<'users'>> => {
  const identity = await auth.getUserIdentity()
  if (!identity) {
    throw new Error('Called storeUser without authentication present')
  }

  const { tokenIdentifier, name, email, pictureUrl } = identity
  if (!(tokenIdentifier && name && email && pictureUrl))
    throw new Error('Could not save user: Incomplete identity info')

  // Check if we've already stored this identity before.
  const user = await db
    .query('users')
    .filter((q) => q.eq(q.field('tokenIdentifier'), tokenIdentifier))
    .first()
  if (user !== null) {
    // If we've seen this identity before but the profile info has changed, patch the value.
    if (
      user.name !== name ||
      user.email !== email ||
      user.pictureUrl !== pictureUrl
    ) {
      await db.patch(user._id, { name, email, pictureUrl })

      if (user.name !== name) {
        // We copy user names into the tasks table to support indexing/ordering
        // So if name has changed we need to find & patch the user's tasks as well
        const tasks = await db
          .query('tasks')
          .withIndex('by_ownerId', (q) => q.eq('ownerId', user._id))
          .collect()
        for (const { _id: taskId } of tasks) {
          await db.patch(taskId, { ownerName: name })
        }
      }
    }
    return user._id
  }
  // If it's a new identity, create a new `User`.
  return db.insert('users', { tokenIdentifier, name, email, pictureUrl })
})
