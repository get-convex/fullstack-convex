import { internalMutation, type DatabaseWriter } from './_generated/server'
import { countResults, findByTask } from './util'
import type { Id, Doc, TableNames } from './_generated/dataModel'
import DATA from "../fullstack/initialData/allData"

type dataKey = keyof typeof DATA;

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

function normalizeIds(db: DatabaseWriter,
  data: typeof DATA[keyof typeof DATA][number]
) {
  if ('ownerId' in data) {
    const unsafeId = data.ownerId;
    if (unsafeId) {
      const id = db.normalizeId('users', unsafeId);
      data.ownerId = id as Id<'users'>;
    }
  }
  if ('userId' in data) {
    const unsafeId = data.userId;
    if (unsafeId) {
      const id = db.normalizeId('users', unsafeId);
      data.userId = id as Id<'users'>;
    }
  }
  if ('taskId' in data) {
    const unsafeId = data.taskId;
    if (unsafeId) {
      const id = db.normalizeId('tasks', unsafeId);
      data.taskId = id as Id<'tasks'>;
    }
  }
  return data;
}


async function resetTable(db: DatabaseWriter, table: 'users' | 'tasks' | 'comments' | 'files' | 'safeFiles') {
  console.log('Resetting table:', table);
  const INIT: typeof DATA[typeof table][number][] = DATA[table as dataKey]
  console.log(INIT.length, 'docs in initial dataset:');
  console.log(INIT.map(d => d._id));

  const existingDocs = await db.query(table).collect();
  console.log(existingDocs.length, 'docs currently in table');

  if (!existingDocs?.length) {
    // Table is empty, must run setup script to import via CLI
    // (cannot do this programmatically in a function because
    // we need control over the ID values to maintain relations)
    throw new Error(`Cannot reset table ${table}; table is empty.
      Run 'npm run init' to import the initial dataset.`)
  }

  // Table is non-empty, filter to the initial dataset
  const updated: Id<typeof table>[] = [];
  const deleted: Id<typeof table>[] = [];

  for (const doc of existingDocs) {
    const initMatch = INIT.filter((d) =>
      db.normalizeId(table, d._id) === doc._id)
    if (initMatch.length === 0) {
      // Doc is not part of the initial dataset; delete
      const delId = db.normalizeId(table, doc._id);
      if (!delId) throw new Error(`Could not normalize ID ${doc._id} in table ${table}`)
      await db.delete(delId);
      deleted.push(delId);
    } else if (initMatch.length === 1) {
      // This doc is part of the initial dataset
      // Update to its data to revert any changes
      const upId = db.normalizeId(table, doc._id);
      if (!upId)
        throw new Error(`Could not normalize ID ${doc._id} in table ${table}`)
      const data = normalizeIds(db, initMatch[0]);
      data._id = upId;
      await db.patch(upId, data as Partial<Doc<typeof table>>);
      updated.push(upId);
    } else {
      // Multiple initial documents matched; something is wrong
      throw new Error(`Found multiple matches for doc ${doc._id} in initial dataset: ${initMatch}`);
    }
  }

  console.log(`Finished resetting table ${table}`);
  console.log(`deleted docs: ${deleted}`);
  console.log(`updated docs: ${updated}`);
  return { deleted, updated }
}

export const reset = internalMutation({
  handler: async (ctx) => {
    console.log('Resetting database tables');

    const users = await resetTable(ctx.db, 'users')
    const tasks = await resetTable(ctx.db, 'tasks')
    const safeFiles = await resetTable(ctx.db, 'safeFiles')
    const files = await resetTable(ctx.db, 'files')
    const comments = await resetTable(ctx.db, 'comments')

    await updateTaskAggregates(ctx.db)

    return { users, tasks, safeFiles, files, comments }
  },
})
