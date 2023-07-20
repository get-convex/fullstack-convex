import { v, Infer } from 'convex/values'
import {
  STATUS_VALUES,
  OWNER_VALUES,
  SortKey,
  SortOrder,
} from '../fullstack/types'

export const vUserId = v.id('users')
export type tUserId = Infer<typeof vUserId>

export const vTaskId = v.id('tasks')
export type tTaskId = Infer<typeof vTaskId>

export const vUser = v.object({
  id: v.string(),
  name: v.string(),
  pictureUrl: v.string(),
})

export const vStatus = v.union(
  v.literal(STATUS_VALUES[0]),
  v.literal(STATUS_VALUES[1]),
  v.literal(STATUS_VALUES[2]),
  v.literal(STATUS_VALUES[3])
)

export const vOwnerFilter = v.array(
  v.union(
    v.literal(OWNER_VALUES[0]),
    v.literal(OWNER_VALUES[1]),
    v.literal(OWNER_VALUES[2])
  )
)

export const vSortKey = v.union(
  v.literal(SortKey.NUMBER),
  v.literal(SortKey.TITLE),
  v.literal(SortKey.STATUS),
  v.literal(SortKey.OWNER),
  v.literal(SortKey.FILES),
  v.literal(SortKey.COMMENTS)
)

export const vSortOrder = v.union(
  v.literal(SortOrder.ASC),
  v.literal(SortOrder.DESC)
)

export const vFindTaskOpts = v.object({
  statusFilter: v.array(vStatus),
  ownerFilter: vOwnerFilter,
  sortKey: vSortKey,
  sortOrder: vSortOrder,
  searchTerm: v.string(),
})

export const vNewTaskInfo = v.object({
  title: v.string(),
  description: v.string(),
  status: vStatus,
  owner: v.union(vUser, v.null()),
})

export const vUpdateTaskInfo = v.object({
  id: v.optional(v.id('tasks')),
  creationTime: v.optional(v.number()),
  number: v.optional(v.number()),
  title: v.optional(v.string()),
  description: v.optional(v.union(v.string(), v.null())),
  status: v.optional(vStatus),
  owner: v.optional(v.union(vUser, v.null())),
  comments: v.optional(v.array(v.any())),
  files: v.optional(v.array(v.any())),
})
