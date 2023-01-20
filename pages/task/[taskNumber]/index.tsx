import Link from 'next/link'
import { useQuery, useMutation } from '../../../convex/_generated/react'
import { HeaderWithLogin } from '../../../components/login'
import type { Document } from '../../../convex/_generated/dataModel'

export default function TaskDetailPage({ taskNumber }: { taskNumber: number }) {
  const user = useQuery('getCurrentUser')
  const task = useQuery('getTask', taskNumber)
  const updateTask = useMutation('updateTask')

  function handleClaimTask() {
    const taskInfo = { ...task, ownerId: user._id } as Partial<Document>
    delete taskInfo.owner // Un-join with owner object
    updateTask(taskInfo)
  }

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

    const isPublic = task.visibility === 'public'
    const isOwner = user._id.equals(task.ownerId)

    return (
      <main>
        <HeaderWithLogin user={user} />
        <div id="task-details">
          <div id="task-header">
            <h2>
              <span>#{task.number}</span>
              {task.title}
            </h2>
            <div>
              {isPublic && !isOwner && (
                <button
                  className="pill-button"
                  title="Make yourself the owner of this task"
                  onClick={handleClaimTask}
                >
                  Claim task
                </button>
              )}
              <Link href={`/task/${task.number}/edit`}>
                <button
                  className="pill-button"
                  title={
                    isOwner
                      ? 'Edit task details'
                      : 'Only the task owner can edit this task'
                  }
                  disabled={!isOwner}
                >
                  Edit task
                </button>
              </Link>
            </div>
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
            <p>{task.owner?.name}</p>

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
