import { Context, createContext } from 'react'
export type User = {
  id: string
  name: string
  pictureUrl: string
}

export type Comment = {
  id: string
  creationTime: number
  author: User
  body: string
}
export type File = {
  id: string
  creationTime: number
  author: User
  size: number
  url: string
  name: string
  type: string
}

export type Task = {
  id: string
  creationTime: number
  number: number
  title: string
  description: string
  comments: Comment[]
  files: File[]
  visibility: Visibility
  status: Status
  owner: User | null
}

export type NewTaskInfo = {
  title: string
  description: string
  visibility: Visibility
  status: Status
  owner: User | null
}

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
  COMMENTS = 'commentCount',
  FILES = 'fileCount',
}
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export type BackendEnvironment = {
  authenticator: {
    user?: User
    isLoading: boolean
    login: () => Promise<void>
    logout: ({ returnTo }: { returnTo: string }) => void
  }
  // fileHandler: {
  //   uploadFile: (taskId: any, file: globalThis.File) => Promise<void>
  //   deleteFile: (fileId: string) => Promise<void>
  // }
  taskManagement: {
    getTask: (taskNumber: any) => Promise<Task | null>
    addComment: (taskId: any, body: string) => Promise<void>
    createTask: (task: Task) => Promise<Task>
    saveTask: (task: Partial<Task>) => Promise<void>
  }
  userManagement: {
    getCurrentUser: () => Promise<User | null>
    saveUser: () => Promise<void>
  }
}

export const BackendContext = createContext(
  null
) as Context<BackendEnvironment | null>
