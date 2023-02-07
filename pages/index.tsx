import { useEffect, useState, useRef } from 'react'
import {
  useMutation,
  useQuery,
  usePaginatedQuery,
} from '../convex/_generated/react'
import { useAuth0 } from '@auth0/auth0-react'
import Link from 'next/link'
import { HeaderWithLogin, Avatar } from '../components/login'
import type { MouseEventHandler, ChangeEventHandler } from 'react'
import { TaskListing } from '../convex/listTasks'
import { Status } from '../convex/schema'
import { useStableData, useStablePaginatedData } from '../hooks/useStableData'

enum Sort {
  NUMBER = 'number',
  TITLE = 'title',
  OWNER = 'owner',
  STATUS = 'status',
  COMMENTS = 'comments',
}

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
    // Save the user in the database (or get an existing user)
    // Recall that `saveUser` gets the user information via the `auth`
    // object on the server. You don't need to pass anything manually here.
    if (!auth0User) return () => null
    async function createUser() {
      await saveUser()
    }
    createUser().catch(console.error)
    return () => {}
  }, [saveUser, auth0User])

  const [statusFilter, setStatusFilter] = useState([
    Status.NEW,
    Status.IN_PROGRESS,
  ])

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
    usePaginatedQuery('listTasks', { initialNumItems: PAGE_SIZE }, statusFilter)
  )
  const isLoading = loadStatus === 'LoadingMore'

  // We use an IntersectionObserver to notice user has reached bottom of list
  const bottom = useRef(null)
  function loadOnScroll(entries: IntersectionObserverEntry[]) {
    if (entries[0].isIntersecting && loadMore) {
      loadMore(PAGE_SIZE)
    }
  }
  useEffect(() => {
    const observer = new IntersectionObserver(loadOnScroll, { threshold: 1 })
    if (bottom.current) {
      observer.observe(bottom.current)
    }
    return () => {
      if (bottom.current) {
        observer.unobserve(bottom.current)
      }
    }
  }, [bottom, loadOnScroll])

  const matching = useStableData(
    // Get the total number of tasks in the db that match the filters,
    // even if all haven't been loaded on the page yet
    useQuery('countTasks', statusFilter)
  )
  const showing = loadedTasks?.length

  const [sortKey, setSortKey] = useState(Sort.NUMBER)
  const [sortReverse, setSortReverse] = useState(1) // 1 or -1, affects sort order (see sortTasks)

  const handleChangeSort: MouseEventHandler = (event) => {
    event.stopPropagation()
    const target = event.target as HTMLElement
    const key = target.id
    if (sortKey === key) {
      // We are already sorting by this key, so a click indicates an order reversal
      setSortReverse(-1 * sortReverse)
    } else {
      setSortKey(key as Sort)
      setSortReverse(1)
    }
  }

  function sortTasks(a: TaskListing, b: TaskListing) {
    // Use the sortKey to compare items by returning a positive/negative/zero number
    // Multiply by the sortReverse factor to change ascending/descending order

    if (a[sortKey] === b[sortKey]) return 0 // Equal

    switch (sortKey) {
      case 'status':
        // Predefined status order, not alphabetical
        const order = Object.values(Status)
        return (order.indexOf(a.status) - order.indexOf(b.status)) * sortReverse
      case 'owner':
        // Alphabetical by owner name
        if (!a.owner?.name) return -1 * sortReverse
        if (!b.owner?.name) return sortReverse
        return a.owner?.name.toLowerCase() < b.owner.name.toLowerCase()
          ? sortReverse * -1
          : sortReverse
      case 'title':
        // Alphabetical by title
        return a.title.toLowerCase() < b.title.toLowerCase()
          ? sortReverse * -1
          : sortReverse
      case 'comments':
        // Default sort order for comment counts is descending
        return (b.comments - a.comments) * sortReverse
      case 'number':
      default:
        // Numeric order
        return (a.number - b.number) * sortReverse
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
            loadedTasks.sort(sortTasks).map((task) => (
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
