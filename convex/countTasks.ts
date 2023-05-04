import { query } from './_generated/server'
import { findUser, countResults } from './internal'
import { findMatchingTasks } from './listTasks'
import { FindTasksOptions } from './listTasks'

// Given a user and their chosen filters, find the total number of matching tasks,
// so we can display the total count even if paginated data hasn't loaded yet
export default query(
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
