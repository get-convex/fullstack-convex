import { cronJobs } from 'convex/server'
import { api } from './_generated/api'

const crons = cronJobs()

crons.daily(
  'Reset all tables to initial dataset',
  { hourUTC: 7, minuteUTC: 0 },
  api.resetData.default
)

export default crons
