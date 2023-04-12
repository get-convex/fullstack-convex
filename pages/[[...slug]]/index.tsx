import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  ChangeEvent,
  MouseEvent,
  useMemo,
} from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useQuery, useMutation, useAction } from '../../convex/_generated/react'
import {
  useStablePaginatedQuery,
  useStableQuery,
} from '../../hooks/useStableQuery'
import {
  Status,
  STATUS_VALUES,
  OWNER_VALUES,
  AppData,
  TaskListOptions,
  SortKey,
  SortOrder,
} from '../../types'
import { BackendContext, DataContext } from '../../context'
import type { BackendEnvironment } from '../../types'
import { TaskManager } from '../../components/taskManager'
import { useConvexAuth } from 'convex/react'
import Head from 'next/head'
import { Inter } from 'next/font/google'

const PAGE_SIZE = 10
const FONT = Inter({ subsets: ['latin'] })

export default function App({ slug }: { slug: number | 'new' | null }) {
  // Check if the user is logged in
  // If user is not logged in, they can still read some data
  const { loginWithRedirect: login, logout: auth0Logout } = useAuth0()
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth()
  const logout = useCallback(
    () => auth0Logout({ logoutParams: { returnTo: window.location.origin } }),
    [auth0Logout]
  )

  const saveUser = useMutation('saveUser'),
    updateTask = useMutation('updateTask'),
    createTask = useMutation('createTask'),
    saveComment = useMutation('saveComment'),
    saveFile = useAction('actions/uploadFile')
  // deleteFile = useMutation('deleteFile'),

  const backend = useMemo(
    () =>
      ({
        authentication: {
          login,
          logout,
          saveUser,
        },
        taskManagement: {
          createTask,
          updateTask,
          saveComment,
          saveFile,
        },
      } as BackendEnvironment),
    [login, logout, saveUser, createTask, updateTask, saveComment, saveFile]
  )

  // Call the `saveUser` mutation function to store/retrieve
  // the currently authenticated user (if any) in the `users` table
  // const saveUser = useMemo(() => userManagement.saveUser, [userManagement.saveUser])

  useEffect(() => {
    // Save the user in the database (or get an existing user)
    // `saveUser` gets the user information from the server
    // so we don't need to pass anything here
    async function createOrUpdateUser() {
      await backend.authentication.saveUser()
    }
    if (isAuthenticated) {
      createOrUpdateUser().catch(console.error)
    }
  }, [backend.authentication, isAuthenticated])

  const user = useQuery('getCurrentUser')

  const [taskNumber, setTaskNumber] = useState(
    typeof slug === 'number' ? slug : null
  )

  const [statusFilter, setStatusFilter] = useState([
    Status.New,
    Status['In Progress'],
  ])
  const onChangeStatus = useCallback(
    (event: ChangeEvent) => {
      const target = event.target as HTMLInputElement
      const { value, checked } = target
      const newFilter = checked
        ? // A formerly unchecked option is now checked; add value to filter
          STATUS_VALUES.filter((s) => statusFilter.includes(s) || s === +value)
        : // A formerly checked option is now unchecked; remove value from filter
          statusFilter.filter((s) => s !== +value)
      setStatusFilter(newFilter)
      return null
    },
    [statusFilter]
  )

  const [ownerFilter, setOwnerFilter] = useState(OWNER_VALUES)
  const onChangeOwner = useCallback(
    (event: ChangeEvent) => {
      const target = event.target as HTMLInputElement
      const { value, checked } = target
      const newFilter = checked
        ? // A formerly unchecked option is now checked; add value to filter
          OWNER_VALUES.filter((s) => ownerFilter.includes(s) || s === value)
        : // A formerly checked option is now unchecked; remove value from filter
          ownerFilter.filter((s) => s !== value)
      setOwnerFilter(newFilter)
      return null
    },
    [ownerFilter]
  )

  const filter = useMemo(
    () => ({
      status: {
        selected: statusFilter,
        onChange: onChangeStatus,
      },
      owner: {
        selected: ownerFilter,
        onChange: onChangeOwner,
      },
    }),
    [statusFilter, onChangeStatus, ownerFilter, onChangeOwner]
  )

  const [sortKey, setSortKey] = useState(SortKey.NUMBER)
  const [sortOrder, setSortOrder] = useState(SortOrder.DESC)
  const onChangeSort = useCallback(
    (event: MouseEvent) => {
      // TODO keyboard
      event.stopPropagation()
      const target = event.target as HTMLElement
      const key = target.id
      if (sortKey === key) {
        // We are already sorting by this key, so a click indicates an order reversal
        setSortOrder(
          sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC
        )
      } else {
        setSortKey(key as SortKey)
        setSortOrder(SortOrder.ASC)
      }
    },
    [sortKey, sortOrder]
  )

  const [searchTerm, setSearchTerm] = useState('')

  const search = useMemo(
    () => ({
      term: searchTerm,
      onChange: setSearchTerm,
    }),
    [searchTerm]
  )

  const listOptions = {
    filter,
    sort: { key: sortKey, order: sortOrder, onChange: onChangeSort },
    selectedTask: {
      number: taskNumber,
      onChange: setTaskNumber,
    },
    search,
  } as TaskListOptions

  // Query the db for the given tasks in the given sort order (updates reactively)
  // Results are paginated, additional pages loaded automatically in infinite scroll
  const {
    results: taskList,
    status: loadStatus,
    loadMore,
  } = useStablePaginatedQuery(
    'listTasks',
    { initialNumItems: PAGE_SIZE },
    { statusFilter, ownerFilter, sortKey, sortOrder, searchTerm }
  )

  // If a task is selected, query the db for the task details
  const task = useStableQuery('getTask', taskNumber)

  // Get the set of safe files pre-approved for upload
  const safeFiles = useQuery('getSafeFiles')

  // When data is loading, Convex's useQuery hook returns undefined,
  // and paginated queries get a specific loadStatus
  // Check for these values to see if a piece of data is still loading
  // Convert undefineds to nulls to match the expected types
  const userData = useMemo(
    () => ({
      value: user || null,
      isLoading: user === undefined || isAuthLoading,
    }),
    [user, isAuthLoading]
  )
  const taskData = useMemo(
    () => ({ value: task || null, isLoading: task === undefined }),
    [task]
  )
  const safeFilesData = useMemo(
    () => ({ value: safeFiles || null, isLoading: safeFiles === undefined }),
    [safeFiles]
  )
  const taskListData = useMemo(
    () => ({
      value: taskList || null,
      isLoading: loadStatus === 'LoadingMore',
    }),
    [taskList, loadStatus]
  )

  const data = useMemo(
    () =>
      ({
        user: userData,
        task: taskData,
        safeFiles: safeFilesData,
        taskList: taskListData,
      } as AppData),
    [userData, taskData, safeFilesData, taskListData]
  )

  const pageTitle =
    slug === 'new'
      ? 'New Task'
      : data.task.value
      ? data.task.value.title
      : 'Fullstack Task Manager'

  // We use an IntersectionObserver to notice user has reached bottom of the page
  // Once they have scrolled to the bottom, load the next set of results
  const bottom = useRef<HTMLDivElement>(null)
  const bottomElem = bottom.current
  useEffect(() => {
    function loadOnScroll(entries: IntersectionObserverEntry[]) {
      if (entries[0].isIntersecting && loadMore) {
        loadMore(PAGE_SIZE)
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
  }, [bottomElem, loadMore])

  return (
    <>
      <BackendContext.Provider value={backend}>
        <DataContext.Provider value={data}>
          <Head>
            <title>{pageTitle}</title>
            <style>{`html { font-family: ${FONT.style.fontFamily}; }`}</style>
          </Head>
          <div className={FONT.className}>
            <TaskManager
              slug={slug}
              options={
                listOptions // TODO move options into the TaskManager component?
              }
            />
            <div ref={bottom} />
          </div>
        </DataContext.Provider>
      </BackendContext.Provider>
    </>
  )
}

export async function getServerSideProps({
  params,
}: {
  params: { slug?: string[] }
}) {
  // Capture the dynamic route segment [[..slug]] (trickier to do client side)
  const [, slug] = params.slug || []
  let pageSlug = slug as number | 'new' | null
  if (!Number.isNaN(+slug)) {
    pageSlug = +slug
  } else if (!slug) {
    pageSlug = null
  }

  return {
    props: { slug: pageSlug },
  }
}
