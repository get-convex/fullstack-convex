import { mutation } from './_generated/server';
import { findUser, getTaskFromDoc } from './internal'
import { Id, Doc } from './_generated/dataModel'
import { Visibility, type Task } from '../fullstack/types'

export default mutation(
  async (queryCtx, { taskInfo }: { taskInfo: Partial<Task> }) => {
    function throwUpdateError(message: string) {
      throw new Error(
        `Error updating task (id: ${taskInfo.id}): ${message}, ${JSON.stringify(
          taskInfo
        )}`
      )
    }

    const { db, auth } = queryCtx
    if (!taskInfo.id) {
      throwUpdateError('No task ID provided')
      return
    }
    const taskId = new Id('tasks', taskInfo.id)
    if (!taskId) {
      throwUpdateError('Could not create ID for this task')
    }

    if (taskInfo.visibility === Visibility.PRIVATE && !taskInfo.owner?.id) {
      // Client side validation should prevent this combination, but double check just in case
      throwUpdateError('Private tasks must have an owner')
    }

    const user = await findUser(db, auth)
    if (!user?._id) {
      throwUpdateError('User identity not found')
    } else if (taskInfo.owner && !(taskInfo.owner.id === user._id.toString())) {
      throwUpdateError('User identity does not match task owner')
    }

    const { owner } = taskInfo
    const ownerId = owner ? new Id('users', owner.id) : null
    const ownerName = owner ? owner.name : null

    // Un-join data from users, comments & files tables
    delete taskInfo.owner
    delete taskInfo.comments
    delete taskInfo.files

    // Delete fields that were auto-populated by Convex
    delete taskInfo.creationTime
    delete taskInfo.id

    const updatedInfo = { ...taskInfo, ownerId, ownerName } as Partial<
      Doc<'tasks'>
    >

    // Get the current task document from the db to compare
    const currentDoc = await db.get(taskId)
    if (!currentDoc) {
      // Should never happen, here to appease TS
      return throwUpdateError(`Task not found: ${taskId}`)
    }

    // Update the search field with new values, if any
    updatedInfo.search = [
      updatedInfo.title || currentDoc.title,
      updatedInfo.description || currentDoc.description,
      updatedInfo.ownerName || currentDoc.ownerName,
    ].join(' ')

    // Update this task in the db & retrieve the updated task document
    await db.patch(taskId, { ...updatedInfo })
    const updatedDoc = await db.get(taskId)
    if (!updatedDoc) {
      // Should never happen, here to appease TS
      throwUpdateError(`Task not found: ${taskId}`)
    } else {
      // Return updated Task object
      return await getTaskFromDoc(queryCtx, updatedDoc)
    }
  }
)
