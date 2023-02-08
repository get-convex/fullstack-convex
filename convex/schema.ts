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
export enum SortKey {
  NUMBER = 'number',
  TITLE = 'title',
  OWNER = 'owner',
  STATUS = 'status',
  // COMMENTS = 'comments',
}
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
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
    })
      .index('by_number', ['number'])
      .index('by_owner', ['ownerId'])
      .index('by_status', ['status'])
      .index('by_title', ['title']),

    users: defineTable({
      email: s.string(),
      name: s.string(),
      pictureUrl: s.string(),
      tokenIdentifier: s.string(),
    }).index('by_tokenIdentifier', ['tokenIdentifier']),

    comments: defineTable({
      body: s.string(),
      taskId: s.id('tasks'),
      userId: s.id('users'),
    }).index('by_task', ['taskId']),
  },
  { strict: false }
)
