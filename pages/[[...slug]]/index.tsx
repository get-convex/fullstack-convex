import React, { useEffect, useState, useRef } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/router'
import { useQuery, useMutation } from '../../convex/_generated/react'
import { useStablePaginatedQuery } from '../../hooks/useStableQuery'
import {
  BackendContext,
  Status,
  STATUS_VALUES,
  OWNER_VALUES,
  DataContext,
  AppData,
  TaskListOptions,
} from '../../types'
import type { BackendEnvironment, NewTaskInfo } from '../../types'
import { useFilter } from '../../hooks/useFilter'
import { useSort } from '../../hooks/useSort'
import { TaskManager } from '../../components/taskManager'

const PAGE_SIZE = 10

export default function App({ slug }: { slug: number | 'new' | null }) {
  // Check if the user is logged in with Auth0 for full write access
  // If user is not logged in, they can still read some data
  const {
    user,
    isLoading: isAuthLoading,
    loginWithRedirect: login,
    logout,
  } = useAuth0()

  const backend = {
    authenticator: {
      isLoading: isAuthLoading,
      login,
      logout,
    },
    userManagement: {
      saveUser: useMutation('saveUser'),
    },
    taskManagement: {
      updateTask: useMutation('updateTask'),
      createTask: useMutation('createTask'),
      saveComment: useMutation('saveComment'),
    },
    // fileHandler: {
    //   uploadFile: (taskId: any, file: globalThis.File) =>
    //     useMutation('saveFile', taskId, file),
    //   deleteFile: (fileId: string) => useMutation('deleteFile', fileId),
    // },
  } as BackendEnvironment

  // Call the `saveUser` mutation function to store/retrieve
  // the currently authenticated user (if any) in the `users` table
  const saveUser = backend.userManagement.saveUser
  useEffect(() => {
    if (!user) return
    // Save the user in the database (or get an existing user)
    // `saveUser` gets the user information from the server
    // so we don't need to pass anything here
    async function createUser() {
      await saveUser()
    }
    createUser().catch(console.error)
  }, [saveUser, user])

  const [taskNumber, setTaskNumber] = useState(
    typeof slug === 'number' ? slug : null
  )

  const task = useQuery('getTask', taskNumber)

  const filter = {
    status: useFilter<Status>(STATUS_VALUES, [
      Status.New,
      Status['In Progress'],
    ]),
    owner: useFilter<string>(OWNER_VALUES, OWNER_VALUES),
  }
  const sort = useSort()

  const listOptions = {
    filter,
    sort,
    selectedTask: { number: taskNumber, onChange: setTaskNumber },
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
    listOptions
  )

  const data = {
    user,
    taskList,
    task,
    isLoading: loadStatus === 'LoadingMore',
  } as AppData

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
    <BackendContext.Provider value={backend}>
      <DataContext.Provider value={data}>
        <TaskManager slug={slug} options={listOptions} />
        <div ref={bottom} />
      </DataContext.Provider>
    </BackendContext.Provider>
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
    props: { pageSlug },
  }
}
