import React, { useEffect, useState, useRef } from 'react'
import { useMutation, useQuery } from '../convex/_generated/react'
import { useAuth0 } from '@auth0/auth0-react'
import {
  useStableQuery,
  useStablePaginatedQuery,
} from '../hooks/useStableQuery'
import { HeaderWithLogin } from '../components/login'
import { Controls } from '../components/controls'
import { Status, STATUS_VALUES, SortKey, SortOrder } from '../convex/schema'
import { TaskListings } from '../components/taskList'
import type { ChangeEventHandler, MouseEventHandler } from 'react'

const PAGE_SIZE = 10

export default function App() {
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

  // Set up state & handler for filtering by status values
  const [statusFilter, setStatusFilter] = useState([
    Status.New,
    Status['In Progress'],
  ])
  const handleChangeFilter: ChangeEventHandler = (event) => {
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
    <main>
      <HeaderWithLogin user={user}>
        <Controls
          user={user}
          statusFilter={statusFilter}
          handleChangeFilter={handleChangeFilter}
        />
      </HeaderWithLogin>

      <TaskListings
        tasks={loadedTasks}
        isLoading={loadStatus === 'LoadingMore'}
        handleChangeSort={handleChangeSort}
      />
      <div ref={bottom} />
    </main>
  )
}
