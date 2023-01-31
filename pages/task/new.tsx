import { useQuery } from '../../convex/_generated/react'
import { HeaderWithLogin } from '../../components/login'
import { TaskDetailForm } from '../../components/taskDetailForm'

export default function CreateTaskPage() {
  const user = useQuery('getCurrentUser')
  if (user === null)
    // This page should only be accessible to logged-in users
    // so we should never reach this, but just in case
    throw new Error('User must be logged in to create a task')

  const newTaskInfo = {
    status: 'New',
    visibility: 'public',
    ownerId: null,
  } as Partial<Document>

  return (
    user && (
      <main className="py-4">
        <HeaderWithLogin user={user} />
        <TaskDetailForm
          user={user}
          mutationName="createTask"
          initialTaskInfo={newTaskInfo}
        />
      </main>
    )
  )
}
