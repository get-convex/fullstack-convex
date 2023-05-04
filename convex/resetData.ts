import { internalMutation, type DatabaseWriter } from './_generated/server'
import { Id, Doc, type TableNames } from './_generated/dataModel'
import { countResults, findByTask } from './internal'
import { User, Task, Comment, File } from '../types'
import type { SafeFile } from './getSafeFiles'

import users from '../fullstack/initialData/users'
import tasks from '../fullstack/initialData/tasks'
import comments from '../fullstack/initialData/comments'
import files from '../fullstack/initialData/files'
import safeFiles from '../fullstack/initialData/safeFiles'

const DATA = { users, tasks, comments, files, safeFiles }
type dataKey = keyof typeof DATA
type dataType = (typeof DATA)[dataKey][0]

async function updateTaskAggregates(db: DatabaseWriter) {
  const tasksToUpdate = await db.query('tasks').collect()

  await Promise.all(
    tasksToUpdate.map(async (task) => {
      const taskId = task._id
      const fileCount = await countResults(findByTask(db, taskId, 'files'))
      const comments = (await findByTask(
        db,
        taskId,
        'comments'
      ).collect()) as Doc<'comments'>[]
      const commentCount = comments.length
      const owner = task.ownerId && (await db.get(task.ownerId))
      const ownerName = owner?.name || ''
      const search = [
        task.title,
        task.description,
        ownerName,
        ...comments.map((c) => c.body),
      ].join(' ')
      await db.patch(taskId, { fileCount, commentCount, search, ownerName })
    })
  )
}

async function resetTable(db: DatabaseWriter, table: TableNames) {
  const KEEP = DATA[table as dataKey]

  const allDocs = await db.query(table).collect()
  const docsToKeep = [],
    docsToDelete = []

  for (const doc of allDocs) {
    const isKeeper = KEEP.some((keeper) =>
      new Id(table, keeper.id).equals(doc._id)
    )
    if (isKeeper) {
      docsToKeep.push(doc)
    } else {
      docsToDelete.push(doc)
    }
  }

  if (docsToKeep.length !== KEEP.length) {
    const offenders = [] as Id<TableNames>[]

    for (const k of KEEP) {
      const id = new Id(table, k.id)
      const doc = await db.get(id)
      if (doc === null) {
        offenders.push(id)
      }
    }

    throw new Error(
      `Wrong number of ${table} to keep: found ${docsToKeep.length}, expected ${
        KEEP.length
      }. Possible offenders:\n${offenders.join('\n')}`
    )
  }
  if (docsToDelete.length !== allDocs.length - KEEP.length) {
    throw new Error(
      `Wrong number of ${table} to delete: found ${
        docsToDelete.length
      }, expected ${allDocs.length - KEEP.length}`
    )
  }

  const updated = await Promise.all(
    KEEP.map(async (keeper: dataType) => {
      const info = { ...keeper } as User | Task | Comment | File | SafeFile
      const docId = new Id(table, keeper.id)

      // Replace relational ID strings with ID objects
      if ('taskId' in info && 'taskId' in keeper) {
        info.taskId = new Id('tasks', keeper.taskId)
      }
      if ('userId' in info && 'userId' in keeper) {
        info.userId = new Id('users', keeper.userId)
      }
      if ('ownerId' in info && 'ownerId' in keeper && keeper.ownerId) {
        info.ownerId = new Id('users', keeper.ownerId)
      }

      await db.patch(docId, info)
      return db.get(docId)
    })
  )

  const deleted = await Promise.all(
    docsToDelete.map(async (d) => {
      await db.delete(d._id)
      return d
    })
  )
  return { deleted, updated }
}

export default internalMutation(async ({ db }) => {
  const users = await resetTable(db, 'users')
  const tasks = await resetTable(db, 'tasks')
  const safeFiles = await resetTable(db, 'safeFiles')
  const files = await resetTable(db, 'files')
  const comments = await resetTable(db, 'comments')
  await updateTaskAggregates(db)

  return { users, tasks, safeFiles, files, comments }
})
