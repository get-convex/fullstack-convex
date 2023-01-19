import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import { useMutation } from '../convex/_generated/react'
import { Document, Id } from '../convex/_generated/dataModel'
import type { MutationNames } from 'convex/dist/types/api/api'
import type { API } from '../convex/_generated/api'

export function TaskDetailForm({
  user,
  mutationName,
  initialTaskInfo,
}: {
  user: Document
  mutationName: MutationNames<API>
  initialTaskInfo?: Document
}) {
  const router = useRouter()
  const saveTask = useMutation(mutationName)

  const taskNumber = initialTaskInfo?.number
  const creationTime = initialTaskInfo?._creationTime
  const taskOwner = initialTaskInfo?.owner || user
  const userList = [taskOwner]
  if (!taskOwner._id.equals(user._id)) {
    userList.push(user)
  }

  const [taskInfo, setTaskInfo] = useState(
    initialTaskInfo ||
      ({
        status: 'New',
        visibility: 'private',
      } as Partial<Document>)
  )

  const invalid = !taskInfo.title

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const task = await saveTask(taskInfo)
    router.push(`/task/${task.number}`)
  }

  return (
    <form
      id="task-details"
      style={{ flexDirection: 'column' }}
      onSubmit={handleSubmit}
    >
      <div id="task-header">
        <h2>
          {taskNumber && <span>#{taskNumber}</span>}
          <input
            value={taskInfo.title}
            // onChange={(e) => setTitle(e.target.value)}
            onChange={(e) =>
              setTaskInfo({ ...taskInfo, title: e.target.value })
            }
            style={{ fontSize: '32px' }}
            placeholder="Task title"
          />
        </h2>
        <div>
          <input
            type="submit"
            value="Save"
            className="pill-button"
            disabled={invalid}
            title={invalid ? 'Title cannot be empty' : 'Save task'}
          />
          <Link href={taskNumber ? `/task/${taskNumber}` : `/`}>
            <button className="cancel">Cancel</button>
          </Link>
        </div>
      </div>

      <div id="task-info">
        <h4>Status</h4>
        <select
          onChange={(e) => setTaskInfo({ ...taskInfo, status: e.target.value })}
        >
          {['New', 'In Progress', 'Done', 'Cancelled'].map((status) => (
            <option
              key={status}
              value={status}
              selected={status === taskInfo.status}
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
            setTaskInfo({ ...taskInfo, description: e.target.value })
          }
        >
          {taskInfo.description}
        </textarea>

        <h4>Owner</h4>
        <select
          onChange={(e) =>
            setTaskInfo({
              ...taskInfo,
              ownerId: new Id('users', e.target.value),
            })
          }
        >
          {userList.map((u: Document) => (
            // TODO this is terrible, currently exposing all users' emails
            <option
              key={u._id}
              value={u._id}
              selected={u._id.equals(taskInfo.ownerId)}
            >
              {u.name}
            </option>
          ))}
        </select>

        <h4>Visibility</h4>
        <select
          onChange={(e) =>
            setTaskInfo({ ...taskInfo, visibility: e.target.value })
          }
        >
          {['private', 'public'].map((v) => (
            <option key={v} value={v} selected={v === taskInfo.visibility}>
              {v}
            </option>
          ))}
        </select>

        {creationTime && (
          <>
            <h4>Created</h4>
            <p>
              <span>{new Date(creationTime).toDateString()}</span>
            </p>
          </>
        )}
      </div>
    </form>
  )
}
