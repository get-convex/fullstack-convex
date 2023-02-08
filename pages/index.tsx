import React, { useEffect, useState, useRef } from 'react'
import {
  useMutation,
  useQuery,
  usePaginatedQuery,
} from '../convex/_generated/react'
import { useAuth0 } from '@auth0/auth0-react'
import Link from 'next/link'
import { HeaderWithLogin, Avatar } from '../components/login'
import type { MouseEventHandler, ChangeEventHandler } from 'react'
import { Status, Sort } from '../convex/schema'
import { useStableData, useStablePaginatedData } from '../hooks/useStableData'

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

  const [statusFilter, setStatusFilter] = useState([
    Status.NEW,
    Status.IN_PROGRESS,
  ])

  const [sortKey, setSortKey] = useState(Sort.STATUS)
  const [sortReverse, setSortReverse] = useState<1 | -1>(1) // 1 or -1, affects sort order
  const sortOrder = sortReverse < 0 ? 'desc' : 'asc'

  const handleChangeFilters: ChangeEventHandler = (event) => {
    // Process a checkbox change event affecting the status filter
    const target = event.target as HTMLInputElement
    const { value, checked } = target
    const newFilter = checked
      ? // A formerly unchecked status filter is now checked; add value to filter
        Object.values(Status).filter(
          (s) => statusFilter.includes(s) || s === value
        )
      : // A formerly checked status filter is now unchecked; remove value from filter
        statusFilter.filter((s) => s !== value)
    setStatusFilter(newFilter)
  }

  // Results are paginated, additional pages loaded automatically in infinite scroll
  const [loadedTasks, loadStatus, loadMore] = useStablePaginatedData(
    usePaginatedQuery(
      'listTasks',
      { initialNumItems: PAGE_SIZE },
      { statusFilter, sortKey, sortOrder }
    )
  )
  const isLoading = loadStatus === 'LoadingMore'

  // We use an IntersectionObserver to notice user has reached bottom of list
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

  const matching = useStableData(
    // Get the total number of tasks in the db that match the filters,
    // even if all haven't been loaded on the page yet
    useQuery('countTasks', statusFilter)
  )
  const showing = loadedTasks?.length

  const handleChangeSort: MouseEventHandler = (event) => {
    event.stopPropagation()
    const target = event.target as HTMLElement
    const key = target.id
    if (sortKey === key) {
      // We are already sorting by this key, so a click indicates an order reversal
      setSortReverse((-1 * sortReverse) as 1 | -1)
    } else {
      setSortKey(key as Sort)
      setSortReverse(1)
    }
  }

  return (
    <main>
      <HeaderWithLogin user={user} />

      <div id="controls">
        <div id="search">
          <input
            value=""
            onChange={() => null}
            placeholder="Search will be here"
          />
        </div>
        <div id="filters">
          {Object.values(Status).map((status) => (
            <label key={`filter-${status.toLowerCase().replace(' ', '-')}`}>
              <input
                key={status}
                type="checkbox"
                id={`filter-${status.toLowerCase().replace(' ', '-')}`}
                value={status}
                onChange={(e) => handleChangeFilters(e)}
                checked={statusFilter.includes(status)}
              />
              {status}
            </label>
          ))}
        </div>
        <div>
          <span id="showing">
            {isLoading
              ? 'Loading... ' // TODO should be a loading spinner or such
              : ''}
            {matching !== undefined &&
              `Showing ${showing} of ${matching} task${
                matching === 1 ? '' : 's'
              }`}
          </span>
          {user && (
            <Link href="/task/new">
              <button className="pill-button" id="new">
                New Task
              </button>
            </Link>
          )}
        </div>
      </div>

      <table>
        <thead>
          <tr id="column-headers">
            <th
              id="number"
              onClick={handleChangeSort}
              style={{ minWidth: '2ch' }}
            >
              #
            </th>
            <th id="title" onClick={handleChangeSort}>
              Task
            </th>
            <th id="owner" onClick={handleChangeSort}>
              Owner
            </th>
            <th id="status" onClick={handleChangeSort}>
              Status
            </th>
            <th id="comments" onClick={handleChangeSort}>
              Comments
            </th>
          </tr>
        </thead>
        <tbody>
          {loadedTasks &&
            loadedTasks.map((task) => (
              <tr key={task.number}>
                <td>
                  <Link href={`/task/${task.number}`}>{task.number}</Link>
                </td>
                <td>
                  <Link href={`/task/${task.number}`}>{task.title}</Link>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {task.owner && <Avatar user={task.owner} size={30} />}
                </td>
                <td>{task.status}</td>
                <td>{task.comments}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <div ref={bottom} />
    </main>
  )
}
