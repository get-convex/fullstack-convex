import React, { FormEvent, useState } from 'react'
import Error from 'next/error'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMutation } from '../convex/_generated/react'
import { Avatar } from './login'
import { Comments, CommentsGhost } from './comments'
import { Files } from './files'
import { StatusPill } from './status'
import { Status, STATUS_VALUES, Visibility } from '../convex/schema'
import type { Task } from '../convex/getTask'
import type { Document } from '../convex/_generated/dataModel'
import { Calendar, CaretDown } from './icons'

export function TaskDetails({
  task,
  user,
}: {
  task?: Task | null
  user?: Document<'users'> | null
}) {
  const updateTask = useMutation('updateTask')

  if (task === undefined) return <TaskDetailsGhost />
  if (task === null)
    return (
      <Error statusCode={404} title="Task not found" withDarkMode={false} />
    )

  function handleClaimTask() {
    const taskInfo = {
      ...task,
      ownerId: user?._id,
      ownerName: user?.name,
    } as Partial<Task>
    saveChanges(taskInfo)
  }

  function handleUnclaimTask() {
    const taskInfo = { ...task, ownerId: null, ownerName: null, owner: null }
    saveChanges(taskInfo)
  }

  function saveChanges(taskInfo: Partial<Task>) {
    delete taskInfo.owner // Un-join with owner object
    updateTask(taskInfo)
  }

  const isPublic = task?.visibility === Visibility.PUBLIC
  const isOwner = user ? user._id.equals(task?.ownerId) : false
  const canChangeOwner = user && isPublic
  return (
    <>
      <div id="task-details">
        <div id="task-header">
          <h2>
            <span id="task-number">{task.number}</span>
            {task.title}
          </h2>
          {/* <div>
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
        </div> */}
        </div>

        <p id="task-description">{task.description}</p>
        <div id="task-info">
          <h4>Owner</h4>
          <div className="owner-details">
            {task.owner && <Avatar user={task.owner} withName={true} />}
            {canChangeOwner && (
              <button
                className="icon-button"
                title={`${
                  isOwner ? 'Remove yourself as' : 'Make yourself'
                } the owner of this task`}
                onClick={isOwner ? handleUnclaimTask : handleClaimTask}
              >
                <CaretDown />
              </button>
            )}
          </div>

          <h4>Status</h4>
          <p>
            <StatusPill value={task.status} height={30} editable={isOwner} />
          </p>

          <h4>Visibility</h4>
          <p>{task.visibility}</p>

          <h4>Created</h4>
          <p>
            <Calendar />
            {new Date(task._creationTime).toDateString()}
          </p>
        </div>
        <h4>Comments</h4>
        {task && <Comments user={user} taskId={task._id} />}

        <h4>Files</h4>
        {task && <Files user={user} taskId={task._id} />}
      </div>
    </>
  )
}

export function EditableTaskDetails({
  user,
  mutationName,
  initialTaskInfo,
  setSelectedTask,
}: {
  user: Document<'users'> | undefined
  mutationName: 'createTask' | 'updateTask'
  initialTaskInfo: Partial<Task>
  setSelectedTask: React.Dispatch<React.SetStateAction<number | null>>
}) {
  const router = useRouter()
  const saveTask = useMutation(mutationName)

  const { number: taskNumber, _creationTime: creationTime } = initialTaskInfo

  const [taskInfo, setTaskInfo] = useState(initialTaskInfo)

  if (user === undefined) return <TaskDetailsGhost />

  const isOwner = user._id.equals(taskInfo.ownerId)
  const isPublic = taskInfo.visibility === Visibility.PUBLIC

  const invalidInput = !taskInfo.title?.trim()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (taskInfo.title) {
      taskInfo.title = taskInfo.title.trim()
    }
    delete taskInfo.owner // Un-join with owner object
    const task = await saveTask(taskInfo)
    router.push(`/task/${task.number}`)
    setSelectedTask(task.number)
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
            value={taskInfo.title || ''}
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
          value={Status[taskInfo.status || 0]}
          onChange={(e) =>
            setTaskInfo({
              ...taskInfo,
              status: +e.target.value,
            })
          }
        >
          {STATUS_VALUES.map((status) => (
            <option key={status} value={status}>
              {Status[status]}
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
              visibility: e.target.value as Visibility,
            })
          }}
        >
          {Object.values(Visibility).map((v) => (
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

function TaskDetailsGhost() {
  return (
    <div id="task-details">
      <div id="task-header">
        <h2>
          <span id="task-number" className="ghost">
            #0
          </span>
          <span className="ghost">
            ....................................................
          </span>
        </h2>
        <div>
          <button className="pill-button ghost" disabled={true}>
            Edit task
          </button>
        </div>
      </div>

      <div id="task-info">
        <h4>Status</h4>
        <p>
          <span className="badge ghost">..........</span>
        </p>

        <h4>Description</h4>
        <p>
          <span className="ghost">
            ...........................................................
          </span>
        </p>

        <h4>Owner</h4>
        <div className="owner-details">
          <div className="ghost avatar-ghost" />
          <span className="ghost">Firstname Lastname</span>
        </div>

        <h4>Visibility</h4>
        <div>
          <span className="ghost">private</span>
        </div>

        <h4>Created</h4>
        <p>
          <span className="ghost">ddd MMM DD YYYY</span>
        </p>

        <h4>Comments</h4>
        <CommentsGhost />
      </div>
    </div>
  )
}
