import React, { useState } from 'react'
import Error from 'next/error'
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
  editing = false,
}: {
  task: Task
  saveChanges: (taskInfo: Partial<Task>) => void
  editing?: boolean
}) {
  const [editingTitle, setEditingTitle] = useState(editing)
  const [newTitle, setNewTitle] = useState(task.title ?? '')

  function handleUpdateTitle() {
    setEditingTitle(false)
    saveChanges({ ...task, title: newTitle })
  }

  const handleKeyDown = function (event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setEditingTitle(false)
    }
  } as KeyboardEventHandler

  return (
    <h2 title="Click to edit" onClick={() => setEditingTitle(true)}>
      {editingTitle ? (
        <form onSubmit={handleUpdateTitle} onBlur={handleUpdateTitle}>
          <input
            type="text"
            value={newTitle}
            placeholder="Add task title"
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
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
  editing = false,
}: {
  task: Task
  saveChanges: (taskInfo: Partial<Task>) => void
  editing?: boolean
}) {
  const [editingDescription, setEditingDescription] = useState(editing)
  const [newDescription, setNewDescription] = useState(task.description ?? '')

  function handleUpdateDescription() {
    setEditingDescription(false)
    saveChanges({ ...task, description: newDescription })
  }

  return (
    <div
      id="task-description"
      title="Click to edit"
      onClick={() => setEditingDescription(true)}
    >
      {editingDescription ? (
        <TextareaInput
          value={newDescription}
          setValue={setNewDescription}
          onSubmit={handleUpdateDescription}
          onCancel={() => setEditingDescription(false)}
          required={false}
          placeholder="Add task description..."
          autoFocus={!editing}
        />
      ) : (
        <p>{task.description || <span>Click to add description</span>}</p>
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
  autoFocus,
}: {
  value?: string
  setValue: (newValue: string) => void
  onSubmit: FormEventHandler
  onCancel: () => void
  required: boolean
  placeholder: string
  autoFocus: boolean
}) {
  const handleKeyDown = function (event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
    }
  } as KeyboardEventHandler

  const handleKeyUp = function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit(event)
    }
  } as KeyboardEventHandler

  return (
    <form onSubmit={onSubmit} onBlur={onSubmit}>
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
        autoFocus={autoFocus}
      />
    </form>
  )
}

function TaskMetadata({
  task,
  user,
  saveChanges,
}: {
  task: Document<'tasks'>
  user: Document<'users'> | null
  saveChanges: (taskInfo: Partial<Task>) => void
}) {
  const isPublic = task?.visibility === Visibility.PUBLIC
  const canChangeOwner = user && isPublic
  const isOwner = user ? user._id.equals(task?.ownerId) : false

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

  return (
    <div id="task-meta">
      <div className="task-meta-row">
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

      <div className="task-meta-row">
        <h4>Status</h4>
        <div>
          <StatusPill value={task.status} height={30} editable={isOwner} />
        </div>
      </div>

      <div className="task-meta-row">
        <h4>Created</h4>
        <div>
          <Calendar />
          {new Date(task._creationTime).toDateString()}
        </div>
      </div>
    </div>
  )
}

function TaskInfo({
  task,
  user,
  onSave,
  newTask,
}: {
  onSave: (taskInfo: Partial<Task>) => void
  task: Task
  user: Document<'users'> | null
  newTask?: boolean
}) {
  const isOwner = user ? user._id.equals(task?.ownerId) : false

  return (
    <div>
      <div id="task-header">
        {isOwner ? (
          <EditableTitle task={task} saveChanges={onSave} editing={newTask} />
        ) : (
          <h2>
            <span id="task-number">{task.number}</span>
            {task.title}
          </h2>
        )}
      </div>

      {isOwner ? (
        <EditableDescription
          task={task}
          saveChanges={onSave}
          editing={newTask}
        />
      ) : (
        task.description && <p>{task.description}</p>
      )}

      <TaskMetadata task={task} user={user} saveChanges={onSave} />
    </div>
  )
}

export function TaskDetails({
  task,
  user,
  onSave,
  newTask = false,
}: {
  onSave: (taskInfo: Partial<Task>) => void
  task?: Task | null
  user?: Document<'users'> | null
  newTask?: boolean
}) {
  if (task === undefined || user === undefined) return <TaskDetailsGhost />
  if (task === null)
    return (
      <Error statusCode={404} title="Task not found" withDarkMode={false} />
    )
  if (user === null)
    return (
      <Error
        statusCode={403}
        title="You must be logged in to create a task"
        withDarkMode={false}
      />
    )

  return (
    <div id="task-details">
      {<TaskInfo task={task} user={user} onSave={onSave} newTask={newTask} />}

      {task && !newTask && <Files user={user} task={task} />}

      {task && !newTask && <Comments user={user} task={task} />}
    </div>
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
