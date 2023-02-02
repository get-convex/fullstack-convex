import { query } from './_generated/server'
import { findUser } from './getCurrentUser'
import { findMatchingTasks } from './listTasks'
import type { GenericTableInfo, OrderedQuery } from 'convex/server'

export async function countResults(query: OrderedQuery<GenericTableInfo>) {
  // If we don't actually care about the task documents, rather
  // than calling .collect() we run through the iterator directly
  let count = 0
  for await (const result of query) {
    count++
  }
  return count
}

// Given a user and their chosen filters, find the total number of matching tasks,
// so we can display the total count even if paginated data hasn't loaded yet
export default query(async ({ db, auth }, statusFilter: string[]) => {
  // If logged in, fetch the stored user to get ID for filtering
  const user = await findUser(db, auth)
  const tasks = findMatchingTasks(db, user, statusFilter)

  return await countResults(tasks)
})
