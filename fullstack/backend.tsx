import React, { useMemo, useCallback, createContext } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useMutation, useAction } from '../convex/_generated/react'
import type { Context, PropsWithChildren } from 'react'
import type { BackendEnvironment } from '../types'

export const BackendContext = createContext(
  null
) as Context<BackendEnvironment | null>

export default function BackendProvider({ children }: PropsWithChildren) {
  const { loginWithRedirect: login, logout: auth0Logout } = useAuth0()
  const logout = useCallback(
    () => auth0Logout({ logoutParams: { returnTo: window.location.origin } }),
    [auth0Logout]
  )

  const saveUser = useMutation('saveUser'),
    updateTask = useMutation('updateTask'),
    createTask = useMutation('createTask'),
    saveComment = useMutation('saveComment'),
    saveFile = useAction('uploadFile'),
    deleteFile = useMutation('deleteFile')

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
