import { Task, User } from '../types'

export function userOwnsTask({ owner }: Partial<Task>, user: User | null) {
  return user ? user.id.toString() === owner?.id.toString() : false
}
