import { cronJobs } from "convex/server";

const crons = cronJobs()

crons.daily(
  'Reset all tables to initial dataset',
  { hourUTC: 7, minuteUTC: 0 },
  'resetData'
)

export default crons
