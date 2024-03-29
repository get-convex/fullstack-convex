export type User = {
  id: string
  name: string
  email?: string
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
  sha256?: string
}

export type NewFileInfo = {
  author: User
  name: string
  type: string
  size: number
  data: ArrayBuffer
}

export type Task = {
  id: string
  creationTime: number
  number: number
  title: string
  description: string | null
  comments: Comment[]
  files: File[]
  status: Status
  owner: User | null
}

export type NewTaskInfo = {
  title: string
  description: string
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

// Owner filter options are just strings
export const OWNER_VALUES = ['Me', 'Others', 'Nobody']

export type Filter<Value> = {
  selected: Value[]
  onChange: (newSelected: Value[]) => void
}

export type TaskListOptions = {
  filter: {
    status: Filter<Status>
    owner: Filter<string>
  }
  sort: {
    key: SortKey
    order: SortOrder
    onChange: (key: SortKey) => void
  }
  search: {
    term: string
    onChange: (term: string) => void
  }
  selectedTask: {
    number?: number | null
    onChange: (task: number | null) => void
  }
}

// Backend environment to be initialized & provided to the app's BackendContext in index.tsx
export type BackendEnvironment = {
  authentication: {
    login: () => Promise<void>
    logout: () => void | Promise<void>
    saveUser: () => Promise<User> // returns newly created/updated User object //TODO this should probably accept a Partial<User>?
  }
  taskManagement: {
    createTask: ({ taskInfo }: { taskInfo: NewTaskInfo }) => Promise<Task> // returns newly created Task object
    updateTask: ({ taskInfo }: { taskInfo: Partial<Task> }) => Promise<Task> // returns updated Task object
    saveComment: ({
      taskId,
      body,
    }: {
      taskId: string
      body: string
    }) => Promise<Comment> // returns newly created Comment objects
  }
  fileManagement: {
    saveFile: ({
      taskId,
      fileInfo,
    }: {
      taskId: string
      fileInfo: NewFileInfo
    }) => Promise<File>
    deleteFile: ({ fileId }: { fileId: string }) => Promise<null>
  }
}

type LoadableData<T> = {
  value: T | null
  isLoading: boolean
}

// Data for the client, to be loaded & provided to the app's DataContext in index.tsx
export type AppData = {
  user: LoadableData<User>
  task: LoadableData<Task>
  taskList: LoadableData<Task[]>
  safeFiles: LoadableData<File[]>
}
