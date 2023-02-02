import { useAuth0 } from '@auth0/auth0-react'
import Link from 'next/link'
import Image from 'next/image'
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

export function HeaderWithLogin({
  user,
}: {
  user: Document<'users'> | null | undefined
}) {
  return (
    <header>
      <Link href="/">
        <h1>Fullstack Task Manager</h1>
      </Link>
      <div style={{ display: 'flex', gap: 10 }}>
        {user && <Avatar user={user} size={50} />}
        {user ? <LogoutButton /> : <LoginButton />}
      </div>
    </header>
  )
}
