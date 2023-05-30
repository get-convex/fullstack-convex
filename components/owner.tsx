import React, { useState, useCallback } from 'react'
import { Avatar, NullAvatar } from './login'
import { CaretDownIcon } from './icons'
import { userOwnsTask } from './helpers'
import { Task, User, Visibility } from '../fullstack/types'
import type { KeyboardEvent } from 'react'

function OwnerAvatar({ task }: { task: Partial<Task> }) {
  return task?.owner ? (
    <Avatar user={task.owner} withName={true} />
  ) : (
    <NullAvatar />
  )
}

export function OwnerSelect({
  task,
  user,
  saveChanges,
}: {
  task: Partial<Task>
  user?: User | null
  saveChanges: ({ taskInfo }: { taskInfo: Partial<Task> }) => void
}) {
  const nullUser: User = {
    name: 'No one',
    id: '',
    pictureUrl: '',
  }
  const isNewTask = !task.id
  const isPublic = task?.visibility === Visibility.PUBLIC
  const canChangeOwner = user && (isPublic || isNewTask)

  const [editing, setEditing] = useState(false)

  const handleClaimTask = useCallback(
    function () {
      const taskInfo = {
        ...task,
        owner: user,
      } as Partial<Task>
      saveChanges({ taskInfo })
    },
    [task, user, saveChanges]
  )

  const handleUnclaimTask = useCallback(
    function () {
      const taskInfo = { ...task, owner: null }
      saveChanges({ taskInfo })
    },
    [task, saveChanges]
  )

  const onKeyDown = useCallback(
    function (event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setEditing(false)
      }
      if (event.key === 'Enter') {
        event.preventDefault()

        setEditing(true)
      }
    },
    [setEditing]
  )

  const changeOwner = useCallback(
    (u: User) => {
      if (!userOwnsTask(task, u)) {
        u.name === 'No one' ? handleUnclaimTask() : handleClaimTask()
      }
      setEditing(false)
    },
    [task, handleClaimTask, handleUnclaimTask]
  )

  const getKeyUpHandler = useCallback(
    function (u: User) {
      return (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          changeOwner(u)
        }
      }
    },
    [changeOwner]
  )

  return canChangeOwner ? (
    <div
      id="owner-select"
      role="button"
      onClick={(e) => {
        e.stopPropagation()
        setEditing(true)
      }}
      onKeyDown={onKeyDown}
    >
      {editing ? (
        <div
          className="owner-options"
          onBlur={(e) => {
            e.stopPropagation()
            if (!e.relatedTarget?.className.startsWith('owner-option'))
              setEditing(false)
          }}
          tabIndex={0}
        >
          {[
            task.owner || nullUser,
            userOwnsTask(task, user) ? nullUser : user,
          ].map((u, i) => {
            const isCurrentOwner =
              userOwnsTask(task, u) || (!task.owner && u.name === nullUser.name)
            return (
              <div
                key={i}
                className="owner-option"
                tabIndex={0}
                onKeyDown={onKeyDown}
                onKeyUp={getKeyUpHandler(u)}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  changeOwner(u)
                  setEditing(false)
                }}
              >
                <label className="owner-label">
                  <input
                    type="radio"
                    name="owner-select"
                    id={`owner-select-${i}`}
                    value={u.id}
                    onChange={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      changeOwner(u)
                    }}
                    checked={isCurrentOwner}
                    tabIndex={-1}
                  />
                  {u.id ? <Avatar user={u} withName={true} /> : <NullAvatar />}
                </label>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="owner-editable" tabIndex={0}>
          <OwnerAvatar task={task} /> <CaretDownIcon />
        </div>
      )}
    </div>
  ) : (
    <OwnerAvatar task={task} />
  )
}
