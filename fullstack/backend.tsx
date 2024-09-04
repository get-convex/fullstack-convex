import { api } from '../convex/_generated/api'
import { useMutation, useAction } from 'convex/react'
import React, { useMemo, createContext } from 'react'
import type { Context, PropsWithChildren } from 'react'
import type { BackendEnvironment } from './types'
import { useAuthActions } from '@convex-dev/auth/react'

export const BackendContext = createContext(
  null
) as Context<BackendEnvironment | null>

export default function BackendProvider({ children }: PropsWithChildren) {
  const { signIn, signOut } = useAuthActions()

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
          login: () => signIn('github').then(() => void 0),
          logout: () => signOut(),
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
      signIn,
      signOut,
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
