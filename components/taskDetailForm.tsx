import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import { useMutation } from '../convex/_generated/react'
import { Document } from '../convex/_generated/dataModel'
import { Avatar } from './login'
import type { MutationNames } from 'convex/dist/types/api/api'
import type { API } from '../convex/_generated/api'

export function TaskDetailForm({
  user,
  mutationName,
  initialTaskInfo,
}: {
  user: Document
  mutationName: MutationNames<API>
  initialTaskInfo: Partial<Document>
}) {
  const router = useRouter()
  const saveTask = useMutation(mutationName)

  const {
    number: taskNumber,
    _creationTime: creationTime,
    owner: taskOwner,
  } = initialTaskInfo

  const [taskInfo, setTaskInfo] = useState(initialTaskInfo)

  const isOwner = user._id.equals(taskInfo.ownerId)
  const isPublic = taskInfo.visibility === 'public'

  const invalidInput = !taskInfo.title

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    delete taskInfo.owner // Un-join with owner object
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
            disabled={invalidInput}
            title={invalidInput ? 'Title cannot be empty' : 'Save task'}
          />
          <Link href={taskNumber ? `/task/${taskNumber}` : `/`}>
            <button className="cancel">Cancel</button>
          </Link>
        </div>
      </div>

      <div id="task-info">
        <h4>Status</h4>
        <select
          value={taskInfo.status}
          onChange={(e) => setTaskInfo({ ...taskInfo, status: e.target.value })}
        >
          {['New', 'In Progress', 'Done', 'Cancelled'].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <h4>Description</h4>
        <textarea
          value={taskInfo.description}
          rows={3}
          onChange={(e) =>
            setTaskInfo({ ...taskInfo, description: e.target.value })
          }
        />

        <h4>Owner</h4>
        <div className="owner-details">
          {taskInfo.owner && (
            <>
              <Avatar user={taskInfo.owner} />
              {taskInfo.owner.name}
            </>
          )}
          {isOwner ? (
            <button
              className="pill-button"
              onClick={(event) => {
                event.preventDefault()
                setTaskInfo({ ...taskInfo, ownerId: null, owner: null })
              }}
              disabled={!isPublic}
              title={
                !isPublic
                  ? 'Private tasks cannot be disowned'
                  : 'Unassign yourself as the owner of this task'
              }
            >
              Disown task
            </button>
          ) : (
            <button
              className="pill-button"
              onClick={(event) => {
                event.preventDefault()
                setTaskInfo({ ...taskInfo, ownerId: user._id, owner: user })
              }}
              title="Make yourself the owner of this task"
            >
              Claim task
            </button>
          )}
        </div>

        <h4>Visibility</h4>
        <select
          value={taskInfo.visibility}
          disabled={!taskInfo.ownerId}
          title={
            isPublic && !taskInfo.ownerId
              ? 'Unowned tasks cannot be made private'
              : 'Public tasks will be visible to all users'
          }
          onChange={(e) => {
            setTaskInfo({
              ...taskInfo,
              visibility: e.target.value,
            })
          }}
        >
          {['private', 'public'].map((v) => (
            <option key={v} value={v}>
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
