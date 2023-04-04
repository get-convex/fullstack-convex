import { Id } from './_generated/dataModel'
import { mutation } from './_generated/server'
import { findUser } from './getCurrentUser'
import { findByTask, getCommentFromDocument } from './getTask'
import { countResults } from './countTasks'
import type { Comment } from '../types'

export default mutation(
  async (queryCtx, taskId: string, body: string): Promise<Comment> => {
    const { db, auth } = queryCtx
    const user = await findUser(db, auth)
    if (!user) {
      throw new Error('Error saving comment: User identity not found')
    }

    const task = await db.get(new Id('tasks', taskId))
    if (!task) {
      throw new Error('Error saving comment: Task not found')
    }

    // Save the new comment
    const commentInfo = { taskId: task._id, userId: user._id, body }
    const commentId = await db.insert('comments', commentInfo)

    // Update the denormalized comment count in the tasks table
    // (used for indexing to support ordering by comment count)
    const commentCount = await countResults(
      findByTask(db, task._id, 'comments')
    )

    await db.patch(task._id, { commentCount })

    // Retrieve the newly saved comment and return as Comment object
    const commentDoc = await db.get(commentId)
    if (!commentDoc) {
      // Should not happen, but just in case/to appease TS
      throw new Error('Unexpected error saving comment')
    }
    return await getCommentFromDocument(queryCtx, commentDoc)
  }
)
