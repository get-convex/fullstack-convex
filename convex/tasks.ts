import { query, mutation } from './_generated/server'
import {
  findUser,
  countResults,
  getTaskFromDoc,
  findMatchingTasks,
  type FindTasksOptions,
} from './internal'
import { type NewTaskInfo, type Task } from '../fullstack/types'
import type { Id, Doc } from './_generated/dataModel'
import type { PaginationOptions } from 'convex/server'

// Given a task's number, retrieve the task document
export const getByNumber = query(
  async (queryCtx, { taskNumber }: { taskNumber: number }) => {
    const { db } = queryCtx

    const taskDoc = await db
      .query('tasks')
      .withIndex('by_number', (q) => q.eq('number', taskNumber))
      .unique()
    if (!taskDoc) return null

    return await getTaskFromDoc(queryCtx, taskDoc)
  }
)

// Given a user and their chosen filters, find the total number of matching tasks,
// so we can display the total count even if paginated data hasn't loaded yet
export const count = query(
  async (
    { db, auth },
    { filterOptions }: { filterOptions: FindTasksOptions }
  ) => {
    // If logged in, fetch the stored user to get ID for filtering
    const user = await findUser(db, auth)
    const tasks = findMatchingTasks(db, user, filterOptions)

    return await countResults(tasks)
  }
)

// List all tasks matching the given options
export const list = query(
  async (
    queryCtx,
    {
      paginationOpts,
      queryOptions,
    }: { paginationOpts: PaginationOptions; queryOptions: FindTasksOptions }
  ) => {
    const { db, auth } = queryCtx
    // If logged in, fetch the stored user to get ID for filtering
    const user = await findUser(db, auth)

    const matchingTasks = findMatchingTasks(db, user, queryOptions)

    const { page, isDone, continueCursor } = await matchingTasks.paginate(
      paginationOpts
    )

    return {
      page: await Promise.all(
        // Join each task with owner details from users table
        page.map(async (taskDoc) => await getTaskFromDoc(queryCtx, taskDoc))
      ),
      isDone,
      continueCursor,
    }
  }
)

// Create a new task document
export const create = mutation(
  async (queryCtx, { taskInfo }: { taskInfo: NewTaskInfo }) => {
    const { db, auth } = queryCtx
    const { title, description, status, owner } = taskInfo
    const ownerIdString = owner && owner.id

    const user = await findUser(db, auth)
    if (!user?._id) {
      throw new Error('Error creating task: User identity not found')
    }

    if (ownerIdString && ownerIdString !== user._id.toString()) {
      // Should never happen, but just to double check
      throw new Error(
        'Error creating task: Current user and task owner do not match'
      )
    }

    // Generate a number for this task, by finding the most
    // recently created task's number and incrementing
    const lastCreatedTask = await db.query('tasks').order('desc').first()
    const number = lastCreatedTask ? lastCreatedTask.number + 1 : 1

    const ownerId = ownerIdString ? user._id : null
    const ownerName = ownerIdString ? user.name : null

    // Copy owner name (if any) and comment count (initally 0) into table
    // so that we can index on these to support ordering with pagination
    const taskId = await db.insert('tasks', {
      ownerId,
      ownerName,
      commentCount: 0,
      fileCount: 0,
      number,
      title,
      description,
      status,
      search: [title, description, ownerName].join(' '),
    })

    // Get the newly saved task document and convert to Task object
    const newTask = await db.get(taskId)
    if (!newTask) {
      // Should not happen, but just in case/to appease TS
      throw new Error('Unexpected error saving task')
    }

    return await getTaskFromDoc(queryCtx, newTask)
  }
)

export const update = mutation(
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
    const taskId = taskInfo.id as Id<'tasks'>
    if (!taskId) {
      throwUpdateError(`Invalid task ID ${taskInfo.id}`)
    }

    const user = await findUser(db, auth)
    if (!user?._id) {
      throwUpdateError('User identity not found')
    } else if (taskInfo.owner && !(taskInfo.owner.id === user._id.toString())) {
      throwUpdateError('User identity does not match task owner')
    }

    const { owner } = taskInfo
    const ownerId = owner ? db.normalizeId('users', owner.id) : null
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
