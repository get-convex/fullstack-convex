import React from 'react'
import Error from 'next/error'
import { useQuery } from '../../convex/_generated/react'
import { HeaderWithLogin } from '../../components/login'
import { Status, Visibility } from '../../convex/schema'
import { EditableTaskDetails } from '../../components/taskDetails'

export default function CreateTaskPage() {
  const user = useQuery('getCurrentUser')

  const newTaskInfo = {
    status: Status.New,
    visibility: Visibility.PUBLIC,
    ownerId: null,
  } as Partial<Document>

  return (
    <main className="py-4">
      <HeaderWithLogin user={user} />
      {user === null ? (
        // This page should only be accessible to logged-in users
        // so we should never reach this, but just in case
        <Error
          statusCode={403}
          title="User must be logged in to create a task"
          withDarkMode={false}
        />
      ) : (
        <EditableTaskDetails
          user={user}
          mutationName="createTask"
          initialTaskInfo={newTaskInfo}
        />
      )}
    </main>
  )
}
