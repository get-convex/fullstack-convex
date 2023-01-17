import { useAuth0 } from '@auth0/auth0-react'
import Link from 'next/link'
import { useQuery } from '../../convex/_generated/react'
import { HeaderWithLogin } from '../index'

export default function TaskDetailPage({ taskNumber }: { taskNumber: number }) {
  const user = useQuery('getCurrentUser')
  const task = useQuery('getTask', taskNumber)
  const isOwner = user && task && user._id.equals(task.ownerId)
  console.log(user, task, isOwner)

  if (task === null)
    return (
      <main>
        <h1>Task not found</h1>
      </main>
    )
  if (task) {
    if (task.error)
      return (
        <main>
          <h1>{task.error}</h1>
        </main>
      )
    return (
      <main>
        <HeaderWithLogin user={user} />
        <div id="task-details">
          <div id="task-header">
            <h2>
              <span>#{task.number}</span>
              {task.title}
            </h2>
            <Link href={`/task/${task.number}/edit`}>
              <button
                className="pill-button"
                title={
                  isOwner
                    ? 'Edit task details'
                    : 'You do not have permission to edit this task'
                }
                disabled={!isOwner}
              >
                Edit task
              </button>
            </Link>
          </div>

          <div id="task-info">
            <h4>Status</h4>
            <p>
              <span className="badge" title={`Status: ${task.status}`}>
                {task.status}
              </span>
            </p>

            <h4>Description</h4>
            <p>{task.description}</p>

            <h4>Owner</h4>
            <p>{task.owner.name}</p>

            <h4>Visibility</h4>
            <p>{task.visibility}</p>

            <h4>Created</h4>
            <p>
              <span>{new Date(task._creationTime).toDateString()}</span>
            </p>
          </div>
        </div>
      </main>
    )
  }
}

export async function getServerSideProps({
  params,
}: {
  params: { taskNumber: number }
}) {
  // Capture the dynamic route segment [taskNumber] (trickier to do client side)
  const { taskNumber } = params
  return {
    props: { taskNumber: +taskNumber },
  }
}
