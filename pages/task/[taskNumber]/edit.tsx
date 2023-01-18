import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import { useMutation, useQuery } from '../../../convex/_generated/react'
import { HeaderWithLogin } from '../../index'
import { Document, Id } from '../../../convex/_generated/dataModel'

export default function TaskDetailPage({ taskNumber }: { taskNumber: number }) {
  const user = useQuery('getCurrentUser')
  const task = useQuery('getTask', taskNumber)

  const allUsers = useQuery('listUsers')

  const router = useRouter()
  const updateTask = useMutation('updateTask')

  const [patch, setPatch] = useState({} as Partial<Document>)

  async function handleUpdateTask(event: FormEvent) {
    event.preventDefault()
    await updateTask(task._id, patch)
    router.push(`/task/${task.number}`)
  }

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
        <form
          id="task-details"
          style={{ flexDirection: 'column' }}
          onSubmit={handleUpdateTask}
        >
          <div id="task-header">
            <h2>
              <span>#{task.number}</span>
              <input
                value={patch.title || task.title}
                // onChange={(e) => setTitle(e.target.value)}
                onChange={(e) => setPatch({ ...patch, title: e.target.value })}
                style={{ fontSize: '32px' }}
              />
            </h2>
            <div>
              <input type="submit" value="Save" className="pill-button" />
              <Link href={`/task/${taskNumber}`}>
                <button className="cancel">Cancel</button>
              </Link>
            </div>
          </div>

          <div id="task-info">
            <h4>Status</h4>
            <select
              onChange={(e) => setPatch({ ...patch, status: e.target.value })}
            >
              {['New', 'In Progress', 'Done', 'Canceled'].map((status) => (
                <option
                  key={status}
                  value={status}
                  selected={status === task.status}
                >
                  {status}
                </option>
              ))}
            </select>

            <h4>Description</h4>
            <textarea
              contentEditable={true}
              rows={3}
              onChange={(e) =>
                setPatch({ ...patch, description: e.target.value })
              }
            >
              {patch.description || task.description}
            </textarea>

            <h4>Owner</h4>
            <select
              onChange={(e) =>
                setPatch({ ...patch, ownerId: new Id('users', e.target.value) })
              }
            >
              {allUsers?.map((u: Document) => (
                // TODO this is terrible, currently exposing all users' emails
                <option
                  key={u._id}
                  value={u._id}
                  selected={u._id.equals(task.owner._id)}
                >
                  {u.name}
                </option>
              ))}
            </select>

            <h4>Visibility</h4>
            <select
              onChange={(e) =>
                setPatch({ ...patch, visibility: e.target.value })
              }
            >
              {['public', 'private'].map((v) => (
                <option key={v} value={v} selected={v === task.visibility}>
                  {v}
                </option>
              ))}
            </select>

            <h4>Created</h4>
            <p>
              <span>{new Date(task._creationTime).toDateString()}</span>
            </p>
          </div>
        </form>
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
