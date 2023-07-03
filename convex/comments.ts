import { Doc } from './_generated/dataModel'
import { mutation } from './_generated/server'
import { findUser, findByTask, getCommentFromDoc } from './internal'
import type { Comment } from '../fullstack/types'

export const save = mutation(
  async (
    queryCtx,
    { taskId, body }: { taskId: string; body: string }
  ): Promise<Comment> => {
    const { db, auth } = queryCtx
    const user = await findUser(db, auth)
    if (!user) {
      throw new Error('Error saving comment: User identity not found')
    }

    const taskDocId = db.normalizeId('tasks', taskId)
    if (taskDocId === null)
      throw new Error(`Error saving comment: Invalid task Id ${taskId}`)

    const task = await db.get(taskDocId)
    if (!task) {
      throw new Error('Error saving comment: Task not found')
    }

    // Save the new comment
    const commentInfo = { taskId: task._id, userId: user._id, body }
    const commentId = await db.insert('comments', commentInfo)

    // Update the tasks table with denormalized comment count
    // (used for indexing to support ordering by comment count)
    // and search string (used for search indexing)
    const comments = (await findByTask(
      db,
      task._id,
      'comments'
    ).collect()) as Doc<'comments'>[]
    const commentCount = comments.length
    const search = [
      task.title,
      task.description,
      task.ownerName,
      comments.map((c) => c.body),
    ]
      .map((f) => f || '')
      .join(' ')

    await db.patch(task._id, { commentCount, search })

    // Retrieve the newly saved comment and return as Comment object
    const commentDoc = await db.get(commentId)
    if (!commentDoc) {
      // Should not happen, but just in case/to appease TS
      throw new Error('Unexpected error saving comment')
    }
    return await getCommentFromDoc(queryCtx, commentDoc)
  }
)
