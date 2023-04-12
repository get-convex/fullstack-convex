import { defineSchema, defineTable, s } from 'convex/schema'
import { Status, Visibility } from '../types'

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
      commentCount: s.number(),
      fileCount: s.number(),
      search: s.string(),
    })
      .index('by_number', ['number'])
      .index('by_ownerId', ['ownerId'])
      .index('by_owner', ['ownerName'])
      .index('by_status', ['status'])
      .index('by_title', ['title'])
      .index('by_commentCount', ['commentCount'])
      .index('by_fileCount', ['fileCount'])
      .searchIndex('search_all', { searchField: 'search' }),

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
