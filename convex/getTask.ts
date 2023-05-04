import { query } from './_generated/server'
import { getTaskFromDoc } from './internal'

export default query(
  async (queryCtx, { taskNumber }: { taskNumber: number | 'new' | null }) => {
    const { db } = queryCtx
    if (!taskNumber || typeof taskNumber !== 'number') return null

    const taskDoc = await db
      .query('tasks')
      .withIndex('by_number', (q) => q.eq('number', taskNumber))
      .unique()
    if (!taskDoc) return null

    return await getTaskFromDoc(queryCtx, taskDoc)
  }
)
