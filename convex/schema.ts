import { defineSchema, defineTable, s } from 'convex/schema'

// Using a numeric rather than string enum for
// ordinal (rather than alphabetical) sorting
export enum Status {
  // keys are the user-facing labels for each
  New = 0,
  'In Progress',
  Done,
  Cancelled,
}
// Numeric enums also have a reverse mapping from
// numeric values to string labels, so separate
// the labels and values for easier use
export const STATUS_VALUES = Object.values(Status).filter(
  (k) => typeof k === 'number'
) as number[]

// The rest are string enums for simplicity
export enum Visibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}
export enum SortKey {
  NUMBER = 'number',
  TITLE = 'title',
  OWNER = 'owner',
  STATUS = 'status',
  COMMENTS = 'comments',
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
      ownerName: s.union(s.string(), s.null()),
      status: s.union(
        s.literal(Status.New),
        s.literal(Status['In Progress']),
        s.literal(Status.Done),
        s.literal(Status.Cancelled)
      ),
      title: s.string(),
      visibility: s.union(
        s.literal(Visibility.PUBLIC),
        s.literal(Visibility.PRIVATE)
      ),
      comments: s.number(),
    })
      .index('by_number', ['number'])
      .index('by_ownerId', ['ownerId'])
      .index('by_owner', ['ownerName'])
      .index('by_status', ['status'])
      .index('by_title', ['title'])
      .index('by_comments', ['comments']),

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

    files: defineTable({
      storageId: s.string(),
      userId: s.id('users'),
      taskId: s.id('tasks'),
      type: s.string(),
      name: s.string(),
    }).index('by_task', ['taskId']),
  },
  { strict: false }
)
