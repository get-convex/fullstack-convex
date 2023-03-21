import React, { useEffect, useState, useRef } from 'react'
import { useMutation, useQuery } from '../../convex/_generated/react'
import { useAuth0 } from '@auth0/auth0-react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import {
  useStableQuery,
  useStablePaginatedQuery,
} from '../../hooks/useStableQuery'
import { Header } from '../../components/login'
import { Controls } from '../../components/controls'
import { Status, STATUS_VALUES, SortKey, SortOrder } from '../../convex/schema'
import { TaskList } from '../../components/taskList'
import { NewTaskSidebar, TaskDetailSidebar } from '../../components/sidebar'
import type { ChangeEventHandler, MouseEventHandler } from 'react'
import type { Task } from '../../convex/getTask'
import type { ReactMutation } from 'convex/react'
import type { API } from '../../convex/_generated/api'

const PAGE_SIZE = 10

export default function App({
  taskNumber,
}: {
  taskNumber: number | 'new' | null
}) {
  // Check if the user is logged in with Auth0 for full write access
  // If user is not logged in, they can still read some data
  const { user: auth0User } = useAuth0()

  // Once this user's profile has been saved to Convex, this query will update
  const user = useQuery('getCurrentUser')

  // Call the `saveUser` mutation function to store/retrieve
  // the current Auth0 user in the `users` table
  const saveUser = useMutation('saveUser')
  useEffect(() => {
    if (!auth0User) return
    // Save the user in the database (or get an existing user)
    // Recall that `saveUser` gets the user information via the `auth`
    // object on the server. You don't need to pass anything manually here.
    async function createUser() {
      await saveUser()
    }
    createUser().catch(console.error)
  }, [saveUser, auth0User])

  // Set up sidebar to view & edit selected task
  const router = useRouter()
  const [selectedTask, setSelectedTask] = useState(
    typeof taskNumber === 'number' ? taskNumber : null
  )
  console.log(selectedTask, router.asPath)
  const task = useQuery('getTask', selectedTask)
  const isSidebarOpen = !!taskNumber

  const pageTitle =
    taskNumber === 'new'
      ? 'New Task'
      : selectedTask && task
      ? task.title
      : 'Fullstack Task Manager'

  const updateTask = useMutation('updateTask')
  const createTask = useMutation('createTask')

  async function saveTask(
    taskInfo: Partial<Task>,
    mutation: ReactMutation<API, 'createTask' | 'updateTask'>
  ) {
    // Un-join data from users, comments, & files tables
    delete taskInfo.owner
    delete taskInfo.comments
    delete taskInfo.files
    const savedTask = await mutation(taskInfo)
    return savedTask
  }

  async function onUpdate(taskInfo: Partial<Task>) {
    return await saveTask(taskInfo, updateTask)
  }

  async function onCreate(taskInfo: Partial<Task>) {
    const newTask = await saveTask(taskInfo, createTask)
    console.log(newTask)
    router.push(`/task/${newTask.number}`)
    setSelectedTask(newTask.number)
    return newTask
  }

  // Set up state & handler for filtering by status values
  const [statusFilter, setStatusFilter] = useState([
    Status.New,
    Status['In Progress'],
  ])
  const handleChangeStatus: ChangeEventHandler = (event) => {
    // Process a checkbox change event affecting the status filter
    const target = event.target as HTMLInputElement
    const { value, checked } = target
    const newFilter = checked
      ? // A formerly unchecked status filter is now checked; add value to filter
        STATUS_VALUES.filter((s) => statusFilter.includes(s) || s === +value)
      : // A formerly checked status filter is now unchecked; remove value from filter
        statusFilter.filter((s) => s !== +value)
    setStatusFilter(newFilter)
  }

  // Set up state & handler for filtering by owner
  const [ownerFilter, setOwnerFilter] = useState(['anyone'])
  const handleChangeOwner: ChangeEventHandler = (event) => {
    const target = event.target as HTMLInputElement
    const { value, checked } = target
    if (checked) {
      setOwnerFilter([value])
    }
  }

  // Get the total number of tasks in the db that match the filters,
  // even if all haven't been loaded on the page yet
  const matching = useStableQuery('countTasks', statusFilter)

  // Set up state & handler for sorting by a given key (column)
  const [sortKey, setSortKey] = useState(SortKey.NUMBER)
  const [sortOrder, setSortOrder] = useState(SortOrder.ASC)
  const handleChangeSort: MouseEventHandler = (event) => {
    event.stopPropagation()
    const target = event.target as HTMLElement
    const key = target.id
    if (sortKey === key) {
      // We are already sorting by this key, so a click indicates an order reversal
      setSortOrder(sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC)
    } else {
      setSortKey(key as SortKey)
      setSortOrder(SortOrder.ASC)
    }
  }

  // Query the db for the given tasks in the given sort order (updates reactively)
  // Results are paginated, additional pages loaded automatically in infinite scroll
  const {
    results: loadedTasks,
    status: loadStatus,
    loadMore,
  } = useStablePaginatedQuery(
    'listTasks',
    { initialNumItems: PAGE_SIZE },
    { statusFilter, sortKey, sortOrder }
  )

  // We use an IntersectionObserver to notice user has reached bottom of list
  // Once they have scrolled to the bottom, load the next page of results
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
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <div
        className={`grid ${isSidebarOpen ? 'with-sidebar' : 'without-sidebar'}`}
      >
        <Header user={user}>
          <Controls
            user={user}
            filters={{
              status: { selected: statusFilter, onChange: handleChangeStatus },
              owner: {
                selected: ownerFilter,
                onChange: handleChangeOwner,
              },
            }}
          />
        </Header>
        <TaskList
          user={user}
          tasks={loadedTasks}
          isLoading={loadStatus === 'LoadingMore'}
          handleChangeSort={handleChangeSort}
          selectedTask={selectedTask}
          setSelectedTask={
            setSelectedTask // TODO make this a proper handler
          }
        />
        {taskNumber === 'new' ? (
          <NewTaskSidebar
            user={user}
            onDismiss={() => setSelectedTask(null)}
            onSave={async (taskInfo) => await onCreate(taskInfo)}
          />
        ) : (
          isSidebarOpen && (
            <TaskDetailSidebar
              user={user}
              task={task}
              onDismiss={() => setSelectedTask(null)}
              onSave={async (taskInfo) => await onUpdate(taskInfo)}
            />
          )
        )}
      </div>
      <div ref={bottom} />
    </>
  )
}

export async function getServerSideProps({
  params,
}: {
  params: { slug?: string[] }
}) {
  // Capture the dynamic route segment [taskNumber] (trickier to do client side)
  const [, slug] = params.slug || []
  let taskNumber = slug as number | 'new' | null
  if (!Number.isNaN(+slug)) {
    taskNumber = +slug
  } else if (!slug) {
    taskNumber = null
  }
  return {
    props: { taskNumber },
  }
}