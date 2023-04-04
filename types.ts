import {
  Context,
  createContext,
  MouseEventHandler,
  type ChangeEventHandler,
} from 'react'

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

// Owner filter options
export const OWNER_VALUES = ['Me', 'Others', 'Nobody']

export type Filter<T> = { selected: T[]; onChange: ChangeEventHandler }

export type TaskListOptions = {
  filter: {
    status: Filter<Status>
    owner: Filter<string>
  }
  sort: {
    key: SortKey
    order: SortOrder
    onChange: MouseEventHandler
  }
  selectedTask: {
    number?: number | null
    onChange: (selected: number | null) => void
  }
}

// Backend environment to be provided by the implementer
export type BackendEnvironment = {
  authenticator: {
    isLoading: boolean
    login: () => Promise<void>
    logout: ({ returnTo }: { returnTo: string }) => void
  }
  // fileHandler: {
  //   uploadFile: (taskId: any, file: globalThis.File) => Promise<void>
  //   deleteFile: (fileId: string) => Promise<void>
  // }
  taskManagement: {
    // getTask: (taskNumber: number | string) => Promise<Task | null>
    // listTasks: (listOptions: ListTasksOptions) => {tasks: Promise<Task[]>, loading?: boolean}
    createTask: (task: NewTaskInfo) => Promise<Task> // returns newly created Task object
    updateTask: (task: Partial<Task>) => Promise<Task> // returns updated Task object
    saveComment: (taskId: string, body: string) => Promise<Comment> // returns newly created Comment objects
  }
  userManagement: {
    // getCurrentUser: () => Promise<User | null>
    saveUser: () => Promise<User> // returns newly created/updated User object
  }
}

export const BackendContext = createContext(
  null
) as Context<BackendEnvironment | null>

export type AppData = {
  user?: User | null
  task?: Task | null
  taskList?: Task[] | null
  isLoading: boolean
}

export const DataContext = createContext(null) as Context<AppData | null>
