import { useQuery } from '../../../convex/_generated/react'
import { HeaderWithLogin } from '../../../components/login'
import { TaskDetailForm } from '../../../components/taskDetailForm'

export default function EditTaskPage({ taskNumber }: { taskNumber: number }) {
  const user = useQuery('getCurrentUser')
  const task = useQuery('getTask', taskNumber, false)

  if (task === null)
    return (
      <main>
        <h1>Task not found</h1>
      </main>
    )
  if (task) {
    const isOwner = user && task && user._id.equals(task.ownerId)

    if (task.error || !isOwner)
      return (
        <main>
          <h1>
            {task.error || 'You do not have permission to edit this task'}
          </h1>
        </main>
      )

    return (
      <main>
        <HeaderWithLogin user={user} />
        <TaskDetailForm
          user={user}
          mutationName="updateTask"
          initialTaskInfo={task}
        />
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
