import { useEffect, useState, ChangeEvent } from 'react'
import { useMutation, useQuery } from '../convex/_generated/react'
import { useAuth0 } from '@auth0/auth0-react'
import Link from 'next/link'
import type { Document } from '../convex/_generated/dataModel'
import { HeaderWithLogin } from '../components/login'

const STATUS = ['New', 'In Progress', 'Done', 'Cancelled'] as const
type Status = typeof STATUS[number]

const SORTKEY = ['number', 'title', 'owner', 'status'] as const
type SortKey = typeof SORTKEY[number]

export default function App() {
  // Check if the user is logged in with Auth0 for full write access
  // If user is not logged in, they can still read some data
  const { user } = useAuth0()
  const [userId, setUserId] = useState<any>(null)
  const storeUser = useMutation('storeUser')
  // Call the `storeUser` mutation function to store/retrieve
  // the current user in the `users` table and return the `Id` value.
  useEffect(() => {
    // Store the user in the database (or get an existing user)
    // Recall that `storeUser` gets the user information via the `auth`
    // object on the server. You don't need to pass anything manually here.
    if (!user) return () => null
    async function createUser() {
      const id = await storeUser()
      setUserId(id)
    }
    createUser().catch(console.error)
    return () => setUserId(null)
  }, [storeUser, user])

  const [statusFilter, setStatusFilter] = useState(['New', 'In Progress'])

  function handleChangeFilters(event: ChangeEvent<HTMLInputElement>) {
    // Process a checkbox change event affecting the status filter
    const { value, checked } = event.target as {
      value: Status
      checked: boolean
    }
    const newFilter = checked
      ? // A formerly unchecked status filter is now checked; add value to filter
        STATUS.filter((s) => statusFilter.includes(s) || s === value)
      : // A formerly checked status filter is now unchecked; remove value from filter
        statusFilter.filter((s) => s !== value)
    setStatusFilter(newFilter)
  }

  const tasks = useQuery('listTasks', statusFilter)
  const [loadedTasks, setLoadedTasks] = useState([] as Document[])

  useEffect(() => {
    // TODO this feels wrong, is there a better solution?
    // The reactive tasks array returned by useQuery is undefined while results are loading/updating
    // Capture results in loadedTasks to avoid the flash of empty tasks list
    if (tasks === undefined) return // Data is loading or updating
    if (tasks === null) {
      // Empty result
      setLoadedTasks([])
    } else {
      // Nonempty result
      setLoadedTasks(tasks)
    }
  }, [tasks])

  const [sortKey, setSortKey] = useState('number' as SortKey)
  const [sortReverse, setSortReverse] = useState(1) // 1 or -1, affects sort order (see sortTasks)

  function handleChangeSort(event) {
    event.stopPropagation()
    const target = event.target as HTMLElement
    const key = target.id
    if (sortKey === key) {
      // We are already sorting by this key, so a click indicates an order reversal
      setSortReverse(-1 * sortReverse)
    } else {
      setSortKey(key as SortKey)
      setSortReverse(1)
    }
  }

  function sortTasks(a: Document, b: Document) {
    // Use the sortKey to compare items by returning a positive/negative/zero number
    // Multiply by the sortReverse factor to change ascending/descending order

    // General cases
    if (a[sortKey] === b[sortKey]) return 0 // Equal
    if (!a[sortKey]) return -1 // First item missing key
    if (!b[sortKey]) return 1 // Second item missing key

    switch (sortKey) {
      case 'status':
        // Predefined order
        const order = ['New', 'In Progress', 'Done', 'Cancelled']
        return (order.indexOf(a.status) - order.indexOf(b.status)) * sortReverse
      case 'owner':
        // Alphabetical by owner name
        return a.owner.name.toLowerCase() < b.owner.name.toLowerCase()
          ? sortReverse * -1
          : sortReverse
      case 'title':
        // Alphabetical by title
        return a.title.toLowerCase() < b.title.toLowerCase()
          ? sortReverse * -1
          : sortReverse
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
          {['New', 'In Progress', 'Done', 'Cancelled'].map((status) => (
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
          {loadedTasks && (
            <span id="showing">
              Showing {loadedTasks.length} task
              {loadedTasks.length === 1 ? '' : 's'}
            </span>
          )}
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
          <tr>
            <th id="number" onClick={handleChangeSort}>
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
          </tr>
        </thead>
        <tbody>
          {loadedTasks.sort(sortTasks).map((task) => (
            <tr key={task.number}>
              <td>
                <Link href={`/task/${task.number}`}>{task.number}</Link>
              </td>
              <td>
                <Link href={`/task/${task.number}`}>{task.title}</Link>
              </td>
              <td>
                {task.owner && (
                  <div
                    className="avatar"
                    style={{ width: 30, height: 30, fontSize: '1.2em' }}
                  >
                    {task.owner.name[0].toUpperCase()}
                  </div>
                )}
              </td>
              <td>{task.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
