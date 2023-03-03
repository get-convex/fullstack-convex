import React, { PropsWithChildren } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Document } from '../convex/_generated/dataModel'

function LogoutButton() {
  const { logout } = useAuth0()
  return (
    <button
      className="dark"
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
      className="dark"
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
  withName = false,
}: {
  user: Document<'users'>
  size?: number
  withName?: boolean
}) {
  let firstName = user.name.split(' ')[0]
  if (firstName.indexOf('@') >= 0) {
    firstName = firstName.split('@')[0]
  }
  return (
    <>
      <Image
        className="avatar"
        src={user.pictureUrl}
        width={size}
        height={size}
        alt={user.name}
        title={user.name}
      />
      {withName && (
        <span className="avatar-name" title={user.name}>
          {firstName}
        </span>
      )}
    </>
  )
}

export function HeaderWithLogin({
  user,
  children,
}: PropsWithChildren<{ user?: Document<'users'> | null }>) {
  return (
    <header>
      <Link href="/">
        <h1>Tasks</h1>
      </Link>
      {children}
      <div style={{ display: 'flex', gap: 10 }}>
        {user && <Avatar user={user} size={38} />}
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
