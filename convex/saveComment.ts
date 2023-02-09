import { Id } from './_generated/dataModel'
import { mutation } from './_generated/server'
import { findUser } from './getCurrentUser'
import { findCommentsByTask } from './listComments'
import { countResults } from './countTasks'

export default mutation(
  async ({ db, auth }, taskId: Id<'tasks'>, body: string) => {
    const user = await findUser(db, auth)

    if (!user) {
      throw new Error('Error saving comment: User identity not found')
    }

    // Save the new comment
    const newComment = { taskId, userId: user._id, body }
    await db.insert('comments', newComment)

    // Update the denormalized comment count in the tasks table
    // (used for indexing to support ordering by comment count)
    const comments = await countResults(findCommentsByTask(db, taskId))

    await db.patch(taskId, { comments })
  }
)
