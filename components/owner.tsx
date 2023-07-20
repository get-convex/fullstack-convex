import React, { useCallback } from 'react'
import { Avatar, NullAvatar } from './login'
import { userOwnsTask } from './helpers'
import { Task, User } from '../fullstack/types'
import { RadioDropdown } from './dropdowns'

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

  const changeOwner = useCallback(
    (u: User) => {
      if (!userOwnsTask(task, u)) {
        u.name === 'No one' ? handleUnclaimTask() : handleClaimTask()
      }
    },
    [task, handleClaimTask, handleUnclaimTask]
  )

  if (!user) {
    return <OwnerAvatar task={task} />
  } else {
    const ownerOptions = [
      task.owner || nullUser,
      userOwnsTask(task, user) ? nullUser : user,
    ]
    return (
      <RadioDropdown
        name="owner"
        selectedValue={task.owner || nullUser}
        options={ownerOptions}
        labels={ownerOptions.map((u) =>
          u.id ? (
            <Avatar key={u.id} user={u} withName={true} />
          ) : (
            <NullAvatar key={'nullUser'} />
          )
        )}
        onChange={changeOwner}
      />
    )
  }
}
