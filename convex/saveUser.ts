import { getUserFromDoc } from './internal'
import { mutation } from './_generated/server'

// Insert or update the user in a Convex table.
//
// The `UserIdentity.tokenIdentifier` string is a stable and unique value we use
// to look up identities.
//
// Keep in mind that `UserIdentity` has a number of optional fields, the
// presence of which depends on the identity provider chosen. It's up to the
// application developer to determine which ones are available and to decide
// which of those need to be persisted.
export default mutation(async (queryCtx) => {
  const { db, auth } = queryCtx
  const identity = await auth.getUserIdentity()
  if (!identity) {
    throw new Error('Called saveUser without authentication present')
  }

  const { tokenIdentifier, name, email, pictureUrl } = identity
  if (!(tokenIdentifier && name && email && pictureUrl))
    throw new Error('Could not save user: Incomplete identity info')

  // Check if we've already stored this identity before.
  const existingUser = await db
    .query('users')
    .filter((q) => q.eq(q.field('tokenIdentifier'), tokenIdentifier))
    .first()

  let savedUser
  if (existingUser === null) {
    // If it's a new identity, create a new `User`.
    const newUserId = await db.insert('users', {
      tokenIdentifier,
      name,
      email,
      pictureUrl,
    })
    savedUser = await db.get(newUserId)
  } else {
    // If we've seen this identity before but the profile info has changed, patch the value.
    if (
      existingUser.name !== name ||
      existingUser.email !== email ||
      existingUser.pictureUrl !== pictureUrl
    ) {
      await db.patch(existingUser._id, { name, email, pictureUrl })

      if (existingUser.name !== name) {
        // We copy user names into the tasks table to support indexing/ordering
        // So if name has changed we need to find & patch the user's tasks as well
        const tasks = await db
          .query('tasks')
          .withIndex('by_ownerId', (q) => q.eq('ownerId', existingUser._id))
          .collect()
        for (const { _id: taskId } of tasks) {
          await db.patch(taskId, { ownerName: name })
        }
      }
    }
    savedUser = await db.get(existingUser._id)
  }

  if (!savedUser) {
    // Should never happen, but just in case/to appease TS
    throw new Error('Unexpected error saving user')
  } else {
    return getUserFromDoc(savedUser)
  }
})
