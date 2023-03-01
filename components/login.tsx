import React from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Document } from '../convex/_generated/dataModel'

function LogoutButton() {
  const { logout } = useAuth0()
  return (
    <button
      className="btn-login"
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
      className="btn-login"
      title="Log in"
      disabled={isLoading}
      onClick={loginWithRedirect}
    >
      Log in
    </button>
  )
}

function LoginGhost() {
  return (
    <button className="ghost" title="Log out" disabled>
      Log out
    </button>
  )
}

export function Avatar({
  user,
  size = 30,
}: {
  user: Document<'users'>
  size?: number
}) {
  return (
    <Image
      src={user.pictureUrl}
      width={size}
      height={size}
      alt={user.name}
      title={user.name}
    />
  )
}

export function HeaderWithLogin({ user }: { user?: Document<'users'> | null }) {
  return (
    <header>
      <Link href="/">
        <h1>Fullstack Task Manager</h1>
      </Link>
      <div style={{ display: 'flex', gap: 10 }}>
        {user && <Avatar user={user} size={50} />}
        {user === undefined ? (
          <LoginGhost />
        ) : user ? (
          <LogoutButton />
        ) : (
          <LoginButton />
        )}
      </div>
    </header>
  )
}
