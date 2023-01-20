import { useAuth0 } from '@auth0/auth0-react'
import Link from 'next/link'
import type { Document } from '../convex/_generated/dataModel'

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

export function HeaderWithLogin({ user }: { user?: Document }) {
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
