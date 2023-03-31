import React, { PropsWithChildren, useContext } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BackendContext, User } from './types'

type Authenticator = {
  isLoading: boolean
  login: () => void
  logout: ({ returnTo }: { returnTo: string }) => void
}

function LogoutButton() {
  const auth = useContext(BackendContext)!.authenticator
  return (
    <button
      className="dark"
      onClick={() => auth.logout({ returnTo: window.location.origin })}
    >
      Log out
    </button>
  )
}

function LoginButton() {
  const auth = useContext(BackendContext)!.authenticator
  return (
    <button
      className="dark"
      title="Log in"
      disabled={auth.isLoading}
      onClick={auth.login}
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
  user: User
  size?: number
  withName?: boolean
}) {
  let firstName = user.name.split(' ')[0]
  if (firstName.indexOf('@') >= 0) {
    firstName = firstName.split('@')[0]
  }
  return (
    <div className="avatar">
      <Image
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
    </div>
  )
}

export function NullAvatar() {
  return (
    <div className="avatar null-avatar">
      <div className="avatar-ghost"></div>
      <span className="avatar-name" title="No one">
        No one
      </span>
    </div>
  )
}

export function Login({ user }: { user?: User | null }) {
  return (
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
  )
}

export function Header({
  user,
  children,
}: PropsWithChildren<{ user?: User | null }>) {
  return (
    <header>
      <Link href="/">
        <h1>Tasks</h1>
      </Link>
      {children}
      <Login user={user} />
    </header>
  )
}
