import React, { useContext, useState, useEffect, useCallback } from 'react'
import NextError from 'next/error'
import { Avatar, NullAvatar } from './login'
import { Comments } from './comments'
import { Files } from './files'
import { StatusPill } from './status'
import {
  AppData,
  BackendEnvironment,
  NewTaskInfo,
  Status,
  Task,
  User,
  Visibility,
} from '../types'
import { BackendContext } from '../fullstack/backend'
import { DataContext } from '../fullstack/data'
import { CalendarIcon, CaretDownIcon } from './icons'
import type { KeyboardEvent, FormEventHandler } from 'react'
import { userOwnsTask } from './helpers'
import { useRouter } from 'next/router'

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

  const handleUpdateTitle = useCallback(() => {
    setEditingTitle(false)
    saveChanges({ ...task, title: newTitle })
  }, [task, newTitle, saveChanges])

  const handleKeyDown = useCallback(function (event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setEditingTitle(false)
    }
  }, [])

  return (
    <h2 title="Click to edit" onClick={() => setEditingTitle(true)}>
      {editingTitle ? (
        <form onSubmit={handleUpdateTitle} onBlur={handleUpdateTitle}>
          <input
            type="text"
            value={newTitle}
            placeholder="Task title"
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

  const handleUpdateDescription = useCallback(
    function () {
      setEditingDescription(false)
      saveChanges({ ...task, description: newDescription })
    },
    [task, newDescription, saveChanges]
  )

  return (
    <div
      id="task-description"
      title="Click to edit"
      onClick={() => setEditingDescription(true)}
    >
      {editingDescription ? (
        <TextareaInput
          value={newDescription}
          onChange={setNewDescription}
          onSubmit={handleUpdateDescription}
          onCancel={() => setEditingDescription(false)}
          required={false}
          placeholder="Task description (optional)"
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
  onChange,
  onSubmit,
  onCancel,
  required,
  placeholder,
  autoFocus,
}: {
  value?: string
  onChange: (newValue: string) => void
  onSubmit: FormEventHandler
  onCancel: () => void
  required: boolean
  placeholder: string
  autoFocus: boolean
}) {
  const handleKeyDown = useCallback(
    function (event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
      }
    },
    [onCancel]
  )

  const handleKeyUp = useCallback(
    function (event: KeyboardEvent) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        onSubmit(event)
      }
    },
    [onSubmit]
  )

  return (
    <form onSubmit={onSubmit} onBlur={onSubmit}>
      <textarea
        value={value}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onChange={(event) => onChange(event.target.value.trimStart())}
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

function OwnerSelect({
  task,
  user,
  saveChanges,
}: {
  task: Task
  user?: User | null
  saveChanges: (taskInfo: Partial<Task>) => void
}) {
  const nullUser: User = {
    name: 'No one',
    id: '',
    pictureUrl: '',
  }
  const isPublic = task?.visibility === Visibility.PUBLIC
  const canChangeOwner = user && isPublic
  const isOwner = user ? user.id === task?.owner?.id : false

  const [editing, setEditing] = useState(false)

  const handleClaimTask = useCallback(
    function () {
      const taskInfo = {
        ...task,
        ownerId: user?.id,
        ownerName: user?.name,
        owner: user,
      } as Partial<Task>
      saveChanges(taskInfo)
    },
    [task, user, saveChanges]
  )

  const handleUnclaimTask = useCallback(
    function () {
      const taskInfo = { ...task, ownerId: null, ownerName: null, owner: null }
      saveChanges(taskInfo)
    },
    [task, saveChanges]
  )

  return (
    <>
      {canChangeOwner && editing ? (
        <div id="owner-select">
          {[task.owner || nullUser, isOwner ? nullUser : user].map((u, i) => {
            const isCurrentOwner = userOwnsTask(task, u)
            return (
              <label
                className="owner-option"
                key={i}
                tabIndex={0}
                htmlFor={`owner-select-${i}`}
              >
                <input
                  type="radio"
                  name="owner-select"
                  id={`owner-select-${i}`}
                  value={u.id}
                  tabIndex={-1}
                  onChange={() => {
                    if (!isCurrentOwner) {
                      u.name === 'No one'
                        ? handleUnclaimTask()
                        : handleClaimTask()
                    }
                    setEditing(false)
                  }}
                  checked={isCurrentOwner}
                />
                {u.id ? <Avatar user={u} withName={true} /> : <NullAvatar />}
              </label>
            )
          })}
        </div>
      ) : (
        <button
          id="owner-button"
          onClick={() => (canChangeOwner ? setEditing(!editing) : null)}
          title={canChangeOwner ? 'Change task owner' : 'Task owner'}
          tabIndex={0}
        >
          {task.owner ? (
            <Avatar user={task.owner} withName={true} />
          ) : (
            <NullAvatar />
          )}
          {canChangeOwner && <CaretDownIcon />}
        </button>
      )}
    </>
  )
}

function TaskMetadata({
  task,
  user,
  saveChanges,
}: {
  task: Task
  user: User | null
  saveChanges: (taskInfo: Partial<Task>) => void
}) {
  const isOwner = userOwnsTask(task, user)

  const handleChangeStatus = useCallback(
    function (status: Status) {
      const taskInfo = { ...task, status }
      saveChanges(taskInfo)
    },
    [task, saveChanges]
  )

  return (
    <div id="task-meta">
      <div className="task-meta-row">
        <h4>Owner</h4>
        <div>
          <OwnerSelect task={task} user={user} saveChanges={saveChanges} />
        </div>
      </div>

      <div className="task-meta-row">
        <h4>Status</h4>
        <div>
          <StatusPill
            value={task.status}
            height={30}
            editable={isOwner}
            onChange={handleChangeStatus}
          />
        </div>
      </div>

      <div className="task-meta-row">
        <h4>Created</h4>
        <div id="task-detail-created">
          <CalendarIcon />
          {new Date(task.creationTime).toDateString()}
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
  onSave: (taskInfo: NewTaskInfo | Partial<Task>) => Promise<Task>
  task: Task
  user: User | null
  newTask?: boolean
}) {
  const isOwner = userOwnsTask(task, user)

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
        task.description && (
          <div id="task-description">
            <p>{task.description}</p>
          </div>
        )
      )}

      <TaskMetadata task={task} user={user} saveChanges={onSave} />
    </div>
  )
}

export function NewTaskDetails() {
  const router = useRouter()
  const { taskManagement } = useContext(BackendContext) as BackendEnvironment
  const {
    user: { value: user, isLoading: isUserLoading },
  } = useContext(DataContext) as AppData

  const [title, setTitle] = useState<string | undefined>('')
  const [description, setDescription] = useState<string | undefined>('')
  const [status, setStatus] = useState(Status.New)
  const [owner, setOwner] = useState<User | null>(user)

  const onCreateTask = useCallback(
    async function (taskInfo: NewTaskInfo) {
      const newTask = await taskManagement.createTask(taskInfo)
      router.push(`/task/${newTask.number}`)
    },
    [taskManagement, router]
  )

  if (isUserLoading) return <TaskDetailsGhost />

  if (!user)
    return (
      <NextError
        statusCode={403}
        title="You must be logged in to create a task"
        withDarkMode={false}
      />
    )

  const newTask = {
    title,
    description,
    status,
    visibility: Visibility.PUBLIC,
    ownerId: owner?.id || user?.id,
    ownerName: owner?.name || user?.name,
    owner: owner || user,
  } as NewTaskInfo

  return (
    <div id="task-details">
      <div>
        <div id="task-header">
          <input
            type="text"
            value={title}
            placeholder="Task title"
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>
        <div id="task-description">
          <TextareaInput
            value={description}
            onChange={
              setDescription //TODO make this a proper handler
            }
            onSubmit={() => null}
            onCancel={() => null}
            required={false}
            placeholder="Task description (optional)"
            autoFocus={false}
          />
        </div>
        <div id="task-meta">
          <div className="task-meta-row">
            <h4>Owner</h4>
            <div>
              <OwnerSelect
                task={newTask as Task}
                user={user}
                saveChanges={({ owner }) => {
                  setOwner(owner || null)
                }}
              />
            </div>
          </div>
          <div className="task-meta-row">
            <h4>Status</h4>
            <div>
              <StatusPill
                value={status}
                height={30}
                editable={true}
                onChange={setStatus}
              />
            </div>
          </div>
        </div>
      </div>
      <div>
        <button
          className="dark"
          title={newTask.title ? 'Save task' : 'Task must have a title'}
          disabled={!newTask.title}
          onClick={() => onCreateTask(newTask)}
        >
          Save task
        </button>
      </div>
    </div>
  )
}

export function TaskDetails() {
  const backend = useContext(BackendContext) as BackendEnvironment
  const { task, user } = useContext(DataContext) as AppData
  if (task.isLoading || user.isLoading) return <TaskDetailsGhost />

  if (!task.value)
    return (
      <NextError statusCode={404} title="Task not found" withDarkMode={false} />
    )

  return (
    <div id="task-details">
      {
        <TaskInfo
          task={task.value}
          user={user.value}
          onSave={backend.taskManagement.updateTask}
        />
      }

      {task && <Files />}

      {task && <Comments user={user.value} task={task.value} />}
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
