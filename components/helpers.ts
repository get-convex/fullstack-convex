import { Task, User } from './types'

export function userOwnsTask(task: Task, user: User | null) {
  return user ? user.id == task.owner?.id : false
}
