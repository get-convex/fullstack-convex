import { useQuery } from '../../convex/_generated/react'
import { Id } from '../../convex/_generated/dataModel'

export default function TaskDetailPage({ taskNumber }: { taskNumber: number }) {
  const task = useQuery('getTask', taskNumber)

  if (task === null)
    return (
      <main className="py-4">
        <h1 className="text-center">Task not found</h1>
      </main>
    )
  if (task) {
    if (task.error)
      return (
        <main className="py-4">
          <h1 className="text-center">{task.error}</h1>
        </main>
      )
    return (
      <main className="py-4">
        <h1 className="text-center">Task details</h1>
        <h2>{task.title}</h2>
        <p>{task.description}</p>
        <p>Owner: {task.owner.name}</p>
        <p>
          Created on <span>{new Date(task._creationTime).toDateString()}</span>
        </p>
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
