import { api } from '../convex/_generated/api'
import { useMutation, useAction } from 'convex/react'
import React, { useMemo, useCallback, createContext } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import type { Context, PropsWithChildren } from 'react'
import type { BackendEnvironment } from './types'

export const BackendContext = createContext(
  null
) as Context<BackendEnvironment | null>

export default function BackendProvider({ children }: PropsWithChildren) {
  const { loginWithRedirect: login, logout: auth0Logout } = useAuth0()
  const logout = useCallback(
    () => auth0Logout({ logoutParams: { returnTo: window.location.origin } }),
    [auth0Logout]
  )

  const saveUser = useMutation(api.users.save),
    updateTask = useMutation(api.tasks.update),
    createTask = useMutation(api.tasks.create),
    saveComment = useMutation(api.comments.save),
    saveFile = useAction(api.files.upload),
    deleteFile = useMutation(api.files.remove)

  const backend = useMemo(
    () =>
      ({
        authentication: {
          login,
          logout,
          saveUser,
        },
        taskManagement: {
          createTask,
          updateTask,
          saveComment,
        },
        fileManagement: {
          saveFile,
          deleteFile,
        },
      } as BackendEnvironment),
    [
      login,
      logout,
      saveUser,
      createTask,
      updateTask,
      saveComment,
      saveFile,
      deleteFile,
    ]
  )
  return (
    <BackendContext.Provider value={backend}>
      {children}
    </BackendContext.Provider>
  )
}
