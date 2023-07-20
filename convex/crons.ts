import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.daily(
  'Reset all tables to initial dataset',
  { hourUTC: 7, minuteUTC: 0 },
  internal.data.reset
)

export default crons
