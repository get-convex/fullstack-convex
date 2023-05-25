import { query } from './_generated/server'
import { getTaskFromDoc } from './internal'

export default query(
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
