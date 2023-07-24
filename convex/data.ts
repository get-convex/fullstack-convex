import { internalMutation, type DatabaseWriter } from './_generated/server'
import { countResults, findByTask } from './util'
import type { Id, Doc, TableNames } from './_generated/dataModel'

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
  const docsToKeep = [] as Doc<TableNames>[],
    docsToDelete = [] as Doc<TableNames>[]

  for (const doc of allDocs) {
    const isKeeper = KEEP.some((keeper) => keeper.id === doc._id)
    if (isKeeper) {
      docsToKeep.push(doc)
    } else {
      docsToDelete.push(doc)
    }
  }

  if (docsToKeep.length !== KEEP.length) {
    const offenders = [] as Id<TableNames>[]

    for (const k of KEEP) {
      const id = db.normalizeId(table, k.id)
      if (id === null)
        throw new Error(`Invalid document id ${k.id} for table ${table}`)
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
      const info = { ...keeper } as Partial<
        Doc<TableNames> & { id: string; creationTime: number }
      >

      const docId = db.normalizeId(table, keeper.id)
      if (docId === null)
        throw new Error(`Invalid document id ${keeper.id} for table ${table}`)

      // Rename fields auto-populated by Convex
      info._id = docId
      delete info.id
      info._creationTime = keeper.creationTime
      delete info.creationTime

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

export const reset = internalMutation({
  handler: async (ctx) => {
    const users = await resetTable(ctx.db, 'users')
    const tasks = await resetTable(ctx.db, 'tasks')
    const safeFiles = await resetTable(ctx.db, 'safeFiles')
    const files = await resetTable(ctx.db, 'files')
    const comments = await resetTable(ctx.db, 'comments')
    await updateTaskAggregates(ctx.db)

    return { users, tasks, safeFiles, files, comments }
  },
})
