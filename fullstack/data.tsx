import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react'
import { useConvexAuth } from 'convex/react'
import {
  useStableQuery,
  useStablePaginatedQuery,
} from '../convex-hooks/useStableQuery'
import { api } from '../convex/_generated/api'
import { BackendContext } from './backend'
import type { Context, PropsWithChildren } from 'react'
import type {
  AppData,
  BackendEnvironment,
  TaskListOptions,
  User,
} from './types'

const PAGE_SIZE = 10

export const DataContext = createContext(null) as Context<AppData | null>

function useTaskListData(
  options: TaskListOptions
): [AppData['taskList'], (n: number) => void] {
  // Get the list of tasks matching the given options selected by the user
  // (filter by status/owner, sort, text search)
  const { filter, sort, search } = options
  const queryOptions = useMemo(
    () => ({
      statusFilter: filter.status.selected,
      ownerFilter: filter.owner.selected,
      sortKey: sort.key,
      sortOrder: sort.order,
      searchTerm: search.term,
    }),
    [filter, sort, search]
  )
  const {
    results: taskList,
    isLoading,
    loadMore,
  } = useStablePaginatedQuery(
    api.tasks.list,
    { queryOptions },
    { initialNumItems: PAGE_SIZE }
  )
  const taskListData = useMemo(
    () => ({
      value: taskList || null,
      isLoading,
    }),
    [taskList, isLoading]
  ) as AppData['taskList']

  return [taskListData, loadMore]
}

function useUserData() {
  const { authentication } = useContext(BackendContext) as BackendEnvironment
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth()

  // Get the currently authenticated user, if any
  const [user, setUser] = useState<User | null>()

  useEffect(() => {
    if (isAuthLoading) return
    // Save the user in the database (or get an existing user)
    // `saveUser` gets the user information from the server
    // so we don't need to pass anything here
    async function createOrUpdateUser() {
      return await authentication.saveUser()
    }
    if (isAuthenticated) {
      createOrUpdateUser()
        .then((savedUser) => setUser(savedUser))
        .catch(console.error)
    } else {
      setUser(null)
    }
  }, [authentication, isAuthenticated, isAuthLoading])

  const userData = useMemo(
    () => ({
      value: user || null,
      isLoading: user === undefined || isAuthLoading,
    }),
    [user, isAuthLoading]
  )
  return userData
}

function LoadAtBottom({ loadTasks }: { loadTasks: (n: number) => void }) {
  // We use an IntersectionObserver to notice user has reached bottom of the page
  // Once they have scrolled to the bottom, load the next set of results
  const bottom = useRef<HTMLDivElement>(null)
  const bottomElem = bottom.current
  useEffect(() => {
    function loadOnScroll(entries: IntersectionObserverEntry[]) {
      if (entries[0].isIntersecting && loadTasks) {
        loadTasks(PAGE_SIZE)
      }
    }
    const observer = new IntersectionObserver(loadOnScroll, { threshold: 1 })
    if (bottomElem) {
      observer.observe(bottomElem)
    }
    return () => {
      if (bottomElem) {
        observer.unobserve(bottomElem)
      }
    }
  }, [bottomElem, loadTasks])

  return <div ref={bottom} />
}

export default function DataProvider({
  taskNumber,
  taskListOptions,
  children,
}: PropsWithChildren<{
  taskNumber: number | 'new' | null
  taskListOptions: TaskListOptions
}>) {
  const user = useUserData()

  // If a task is selected, query the db for the task details
  const task = useStableQuery(api.tasks.getByNumber, {
    taskNumber: taskNumber as number,
  })
  const taskData = useMemo(
    () => ({ value: task || null, isLoading: task === undefined }),
    [task]
  )

  // Get the set of safe files pre-approved for upload
  const safeFiles = useStableQuery(api.files.getSafeFiles)

  const safeFilesData = useMemo(
    () => ({ value: safeFiles || null, isLoading: safeFiles === undefined }),
    [safeFiles]
  )

  const [taskList, loadMoreTasks] = useTaskListData(taskListOptions)

  // Collect the loaded/loading AppData to pass to components via DataContext
  const data = useMemo(
    () =>
      ({
        user,
        task: taskData,
        safeFiles: safeFilesData,
        taskList,
      } as AppData),
    [user, taskData, safeFilesData, taskList]
  )
  return (
    <DataContext.Provider value={data}>
      {children}
      <LoadAtBottom loadTasks={loadMoreTasks} />
    </DataContext.Provider>
  )
}
