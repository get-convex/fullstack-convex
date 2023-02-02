import { defineSchema, defineTable, s } from 'convex/schema'

export enum Status {
  NEW = 'New',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
  CANCELLED = 'Cancelled',
}
export enum Visibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export default defineSchema(
  {
    tasks: defineTable({
      description: s.optional(s.string()),
      number: s.number(),
      ownerId: s.union(s.id('users'), s.null()),
      status: s.union(
        s.literal(Status.NEW),
        s.literal(Status.IN_PROGRESS),
        s.literal(Status.DONE),
        s.literal(Status.CANCELLED)
      ),
      title: s.string(),
      visibility: s.union(
        s.literal(Visibility.PUBLIC),
        s.literal(Visibility.PRIVATE)
      ),
    }),
    users: defineTable({
      email: s.string(),
      name: s.string(),
      pictureUrl: s.string(),
      tokenIdentifier: s.string(),
    }),
    comments: defineTable({
      body: s.string(),
      taskId: s.id('tasks'),
      userId: s.id('users'),
    }),
  },
  { strict: false }
)
