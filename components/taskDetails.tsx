import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { FormEvent, useState } from 'react'
import { useMutation } from '../convex/_generated/react'
import { Avatar } from './login'
import { Comments } from './comments'
import { Status, Visibility } from '../convex/schema'
import type { Task } from '../convex/getTask'
import type { Document } from '../convex/_generated/dataModel'

function TaskDetailsGhost() {
  return (
    <div id="task-details">
      <div id="task-header">
        <h2>
          <span>#0</span>
          .....
        </h2>
        <div>
          <button className="pill-button" disabled={true}>
            Edit task
          </button>
        </div>
      </div>

      <div id="task-info">
        <h4>Status</h4>
        <p>
          <span className="badge">....</span>
        </p>

        <h4>Description</h4>
        <p>...</p>

        <h4>Owner</h4>
        <div className="owner-details">...</div>

        <h4>Visibility</h4>
        <p>....</p>

        <h4>Created</h4>
        <p>
          <span>...</span>
        </p>

        <h4>Comments</h4>
        <p>....</p>
      </div>
    </div>
  )
}
export function TaskDetails({
  task,
  user,
}: {
  task?: Task
  user?: Document<'users'> | null
}) {
  const updateTask = useMutation('updateTask')

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
  const isOwner = user && user._id.equals(task?.ownerId)
  const canChangeOwner = user && isPublic
  return task ? (
    <div id="task-details">
      <div id="task-header">
        <h2>
          <span>#{task.number}</span>
          {task.title}
        </h2>
        <div>
          {canChangeOwner && (
            <button
              className="pill-button"
              title={`${
                isOwner ? 'Unassign yourself as' : 'Make yourself'
              } the owner of this task`}
              onClick={isOwner ? handleUnclaimTask : handleClaimTask}
            >
              {isOwner ? 'Disown task' : 'Claim task'}
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
        <div className="owner-details">
          {task.owner && (
            <>
              <Avatar user={task.owner} />
              {task.owner.name}
            </>
          )}
        </div>

        <h4>Visibility</h4>
        <p>{task.visibility}</p>

        <h4>Created</h4>
        <p>
          <span>{new Date(task._creationTime).toDateString()}</span>
        </p>

        <h4>Comments</h4>
        {task && <Comments user={user} taskId={task._id} />}
      </div>
    </div>
  ) : (
    <TaskDetailsGhost />
  )
}

export function EditableTaskDetails({
  user,
  mutationName,
  initialTaskInfo,
}: {
  user: Document<'users'>
  mutationName: 'createTask' | 'updateTask'
  initialTaskInfo: Partial<Task>
}) {
  const router = useRouter()
  const saveTask = useMutation(mutationName)

  const { number: taskNumber, _creationTime: creationTime } = initialTaskInfo

  const [taskInfo, setTaskInfo] = useState(initialTaskInfo)

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
          value={taskInfo.status}
          onChange={(e) =>
            setTaskInfo({
              ...taskInfo,
              status: e.target.value as Status,
            })
          }
        >
          {Object.values(Status).map((status) => (
            <option key={status} value={status}>
              {status.split('_')[1]}
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
