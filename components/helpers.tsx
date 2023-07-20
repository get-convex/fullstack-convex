import { Task, User } from '../fullstack/types'

// Check if the currently authenticated user is the owner of a task
export function userOwnsTask({ owner }: Partial<Task>, user: User | null) {
  return user ? user.id === owner?.id : false
}

// Display creation time relative to current time, e.g. "6 days ago"
export function showTimeAgo(created: Date) {
  const now = Date.now()
  const secondsAgo = Math.round((now - created.valueOf()) / 1000)
  if (secondsAgo < 60) return 'just now'
  const minutesAgo = Math.round(secondsAgo / 60)
  if (minutesAgo < 60) {
    return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`
  }
  const hoursAgo = Math.round(minutesAgo / 60)
  if (hoursAgo < 24) {
    return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`
  }
  const daysAgo = Math.round(hoursAgo / 24)
  return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`
}
