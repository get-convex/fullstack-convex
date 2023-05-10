import { defineSchema, defineTable } from 'convex/schema'
import { v } from 'convex/values'
import { Status, Visibility } from '../fullstack/types'

export default defineSchema({
  tasks: defineTable({
    description: v.union(v.string(), v.null()),
    number: v.number(),
    ownerId: v.union(v.id('users'), v.null()),
    ownerName: v.union(v.string(), v.null()),
    status: v.union(
      v.literal(Status.New),
      v.literal(Status['In Progress']),
      v.literal(Status.Done),
      v.literal(Status.Cancelled)
    ),
    title: v.string(),
    visibility: v.union(
      v.literal(Visibility.PUBLIC),
      v.literal(Visibility.PRIVATE)
    ),
    commentCount: v.number(),
    fileCount: v.number(),
    search: v.string(),
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
    email: v.string(),
    name: v.string(),
    pictureUrl: v.string(),
    tokenIdentifier: v.string(),
  }).index('by_tokenIdentifier', ['tokenIdentifier']),

  comments: defineTable({
    body: v.string(),
    taskId: v.id('tasks'),
    userId: v.id('users'),
  }).index('by_task', ['taskId']),

  files: defineTable({
    storageId: v.string(),
    userId: v.id('users'),
    taskId: v.id('tasks'),
    type: v.string(),
    name: v.string(),
  }).index('by_task', ['taskId']),

  safeFiles: defineTable({
    storageId: v.string(),
    name: v.string(),
    sha256: v.string(),
  }),
})
