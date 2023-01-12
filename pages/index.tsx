import { FormEvent, useEffect, useState } from 'react'
import { useMutation, useQuery } from '../convex/_generated/react'
import { useAuth0 } from '@auth0/auth0-react'
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
  }, [storeUser])

  const tickets = useQuery('listTickets')

  return (
    <main>
      <h1>Convex Todos</h1>
      <p className="badge">
        <span>{user?.name || 'Anonymous'}</span>
        {user ? <LogoutButton /> : <LoginButton />}
      </p>
      {tickets === undefined ? (
        'Loading tickets...'
      ) : tickets === null ? (
        'No tickets found'
      ) : (
        <table>
          <tr>
            <th>Task</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Visibility</th>
            <th>Created</th>
          </tr>
          {tickets.map((ticket) => (
            <tr key={ticket._id.toString()}>
              <td>{ticket.title}</td>
              <td>{ticket.owner.name}&nbsp;</td>
              <td>{ticket.status}</td>
              <td>{ticket.visibility}&nbsp;</td>
              <td>{new Date(ticket._creationTime).toDateString()}</td>
            </tr>
          ))}
        </table>
      )}
      <Link href="/ticket/new">
        <button className="btn btn-primary">New ticket</button>
      </Link>
    </main>
  )
}
