import { useQuery } from '../../convex/_generated/react'
import { Id } from '../../convex/_generated/dataModel'

export default function TaskDetailPage({ taskId }: { taskId: string }) {
  const id = new Id('tasks', taskId)
  if (!id) throw new Error(`Invalid task ID: ${id}`)

  // TODO getTask will throw an error if the ID isn't valid,
  // e.g. '1234', which shouldn't happen during normal app use
  // but should be handled nonetheless (in case of e.g. manually entered route)
  const task = useQuery('getTask', id)

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
  params: { taskId: string }
}) {
  // Capture the dynamic route segment [taskId] (trickier to do client side)
  const { taskId } = params
  return {
    props: { taskId },
  }
}
