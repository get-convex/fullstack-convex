import React, { useState } from 'react'
import Error from 'next/error'
import { useMutation } from '../convex/_generated/react'
import { Avatar } from './login'
import { Comments } from './comments'
import { Files } from './files'
import { StatusPill } from './status'
import { Visibility } from '../convex/schema'
import { Calendar, CaretDown } from './icons'
import type { KeyboardEventHandler, FormEventHandler } from 'react'
import type { Task } from '../convex/getTask'
import type { Document } from '../convex/_generated/dataModel'

function EditableTitle({
  task,
  saveChanges,
}: {
  task: Task
  saveChanges: (taskInfo: Partial<Task>) => void
}) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState(task.title)

  function handleUpdateTitle() {
    setEditingTitle(false)
    saveChanges({ _id: task?._id, title: newTitle })
  }

  const handleKeyUp = function (event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setEditingTitle(false)
    }
  } as KeyboardEventHandler

  return (
    <h2
      title="Double click to edit title"
      onDoubleClick={() => setEditingTitle(true)}
    >
      {editingTitle ? (
        <form onSubmit={handleUpdateTitle}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyUp={handleKeyUp}
            autoFocus
          />
        </form>
      ) : (
        <>
          <span id="task-number">{task.number}</span>
          {task.title}
        </>
      )}
    </h2>
  )
}

function EditableDescription({
  task,
  saveChanges,
}: {
  task: Task
  saveChanges: (taskInfo: Partial<Task>) => void
}) {
  const [editingDescription, setEditingDescription] = useState(false)
  const [newDescription, setNewDescription] = useState(task.description)

  function handleUpdateDescription() {
    setEditingDescription(false)
    saveChanges({ _id: task?._id, description: newDescription })
  }

  return (
    <div
      id="task-description"
      title="Double click to edit description"
      onDoubleClick={() => setEditingDescription(true)}
    >
      {editingDescription ? (
        <TextareaInput
          value={newDescription}
          setValue={setNewDescription}
          onSubmit={handleUpdateDescription}
          onCancel={() => setEditingDescription(false)}
          required={false}
          placeholder="Add task description..."
        />
      ) : (
        <p>
          {task.description || <span>Double click to add description</span>}
        </p>
      )}
    </div>
  )
}

function TextareaInput({
  value,
  setValue,
  onSubmit,
  onCancel,
  required,
  placeholder,
}: {
  value: any
  setValue: any
  onSubmit: () => any
  onCancel: () => any
  required: boolean
  placeholder: string
}) {
  const handleKeyDown = function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
    }
  } as KeyboardEventHandler

  const handleKeyUp = function (event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  } as KeyboardEventHandler

  return (
    <form onSubmit={onSubmit}>
      <textarea
        value={value}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onChange={(event) => setValue(event.target.value.trimStart())}
        placeholder={placeholder}
        title={
          'Enter to submit, Shift+Enter for newline, Esc to cancel editing' +
          (required && !value ? '\nField cannot be empty' : ' ')
        }
        required={required}
        autoFocus
      />
    </form>
  )
}

export function TaskDetails({
  task,
  user,
}: {
  task?: Task | null
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
    // Un-join data from users, comments, & files tables
    delete taskInfo.owner
    delete taskInfo.comments
    delete taskInfo.files
    updateTask(taskInfo)
  }

  const isPublic = task?.visibility === Visibility.PUBLIC
  const isOwner = user ? user._id.equals(task?.ownerId) : false
  const canChangeOwner = user && isPublic

  if (task === undefined) return <TaskDetailsGhost />
  if (task === null)
    return (
      <Error statusCode={404} title="Task not found" withDarkMode={false} />
    )

  return (
    <>
      <div id="task-details">
        <div>
          <div id="task-header">
            {isOwner ? (
              <EditableTitle task={task} saveChanges={saveChanges} />
            ) : (
              <h2>
                <span id="task-number">{task.number}</span>
                {task.title}
              </h2>
            )}
          </div>

          {isOwner ? (
            <EditableDescription task={task} saveChanges={saveChanges} />
          ) : (
            task.description && <p>{task.description}</p>
          )}

          <div id="task-info">
            <div className="task-info-row">
              <h4>Owner</h4>
              <div className="owner-details">
                {task.owner ? (
                  <Avatar user={task.owner} withName={true} />
                ) : (
                  <div></div>
                )}
                {canChangeOwner && (
                  <button
                    className="icon-button"
                    title={`${
                      //TODO this should be a drop down
                      isOwner ? 'Remove yourself as' : 'Make yourself'
                    } the owner of this task`}
                    onClick={isOwner ? handleUnclaimTask : handleClaimTask}
                  >
                    <CaretDown />
                  </button>
                )}
              </div>
            </div>

            <div className="task-info-row">
              <h4>Status</h4>
              <div>
                <StatusPill
                  value={task.status}
                  height={30}
                  editable={isOwner}
                />
              </div>
            </div>

            {/* <div className="task-info-row">
              <h4>Visibility</h4>
              <div>{task.visibility}</div>
            </div> */}

            <div className="task-info-row">
              <h4>Created</h4>
              <div>
                <Calendar />
                {new Date(task._creationTime).toDateString()}
              </div>
            </div>
          </div>
        </div>

        {task && <Files user={user} task={task} />}

        {task && <Comments user={user} task={task} />}
      </div>
    </>
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
            ........................................
          </span>
        </h2>
      </div>

      <div id="task-description">
        <p className="ghost">
          ....................................................
        </p>
      </div>

      <div id="task-info">
        <div className="task-info-row">
          <h4>Owner</h4>
          <div className="owner-details">
            <div className="ghost avatar-ghost" />
            <span className="ghost">Firstname Lastname</span>
          </div>
        </div>

        <div className="task-info-row">
          <h4>Status</h4>
          <p>
            <span className="badge ghost">..........</span>
          </p>
        </div>

        <div className="task-info-row">
          <h4>Created</h4>
          <p>
            <span className="ghost">ddd MMM DD YYYY</span>
          </p>
        </div>
      </div>
    </div>
  )
}
