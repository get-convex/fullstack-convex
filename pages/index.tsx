import { FormEvent, useEffect, useState } from 'react'
import { useMutation, useQuery } from '../convex/_generated/react'
import { useAuth0, User } from '@auth0/auth0-react'
import Link from 'next/link'

function LogoutButton() {
  const { logout } = useAuth0()
  return (
    <button
      className="btn btn-primary"
      onClick={() => logout({ returnTo: window.location.origin })}
    >
      Log out
    </button>
  )
}

function LoginButton() {
  const { isLoading, loginWithRedirect } = useAuth0()
  return (
    <button
      className="btn btn-primary"
      disabled={isLoading}
      onClick={loginWithRedirect}
    >
      Log in
    </button>
  )
}

export function LoginPage() {
  return (
    <main className="py-4">
      <h1 className="text-center">Convex Todos</h1>
      <p className="text-center">Please log in to continue</p>
      <div className="text-center">
        <span>{LoginButton()}</span>
      </div>
    </main>
  )
}

export function HeaderWithLogin({ user }: { user?: User }) {
  return (
    <header>
      <Link href="/">
        <h1>Fullstack Task Manager</h1>
      </Link>
      <div style={{ display: 'flex' }}>
        {user && user.name && (
          <div className="avatar" style={{ width: 50, height: 50 }}>
            {user.name[0].toUpperCase()}
          </div>
        )}
        {user ? <LogoutButton /> : <LoginButton />}
      </div>
    </header>
  )
}

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

  const tasks = useQuery('listTasks')

  const [checked, setChecked] = useState({
    New: true,
    'In Progress': true,
    Done: false,
    Cancelled: false,
  })

  function toggleChecked(value: string) {
    setChecked({ ...checked, [value]: !checked[value] })
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
            <>
              <input
                type="checkbox"
                id={`filter-${status.toLowerCase().replace(' ', '-')}`}
                value={status}
                onChange={(e) => toggleChecked(e.target.value)}
                checked={checked[status]}
              />
              <label
                htmlFor={`filter-${status.toLowerCase().replace(' ', '-')}`}
              >
                {status}
              </label>
            </>
          ))}
        </div>
        <div>
          {tasks && (
            <span id="showing">
              Showing {tasks.length} of {tasks.length} tasks
            </span>
          )}
          <Link href="/task/new">
            <button className="pill-button" id="new">
              New Task
            </button>
          </Link>
        </div>
      </div>

      {tasks === undefined ? (
        'Loading tasks...'
      ) : tasks === null ? (
        'No tasks found'
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Task</th>
              <th>Owner</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks
              .filter((task) => checked[task.status])
              .map((task) => (
                <tr key={task.number}>
                  <td>
                    <Link href={`/task/${task.number}`}>{task.number}</Link>
                  </td>
                  <td>
                    <Link href={`/task/${task.number}`}>{task.title}</Link>
                  </td>
                  <td>
                    <div
                      className="avatar"
                      style={{ width: 30, height: 30, fontSize: '1.2em' }}
                    >
                      {task.owner.name[0].toUpperCase()}
                    </div>
                  </td>
                  <td>{task.status}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
