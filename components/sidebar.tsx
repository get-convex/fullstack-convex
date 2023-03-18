import React from 'react'
import Link from 'next/link'
import { CircledX } from './icons'
import { TaskDetails } from './taskDetails'
import { Status, Visibility } from '../convex/schema'
import type { PropsWithChildren, MouseEventHandler } from 'react'
import type { Document } from '../convex/_generated/dataModel'
import type { Task } from '../convex/getTask'

export function Sidebar({
  onDismiss,
  children,
}: PropsWithChildren<{ onDismiss: MouseEventHandler }>) {
  return (
    <aside id="sidebar" role="dialog" aria-label="Task details">
      {children}
      <Link
        role="button"
        id="close-sidebar"
        className="icon-button"
        aria-label="Close task details"
        href="/"
        onClick={onDismiss}
      >
        <CircledX />
      </Link>
    </aside>
  )
}

export function TaskDetailSidebar({
  task,
  user,
  onDismiss,
  onSave,
}: {
  task?: Task | null
  user?: Document<'users'> | null
  onDismiss: MouseEventHandler
  onSave: (taskInfo: Partial<Task>) => void
}) {
  return (
    <Sidebar onDismiss={onDismiss}>
      <TaskDetails task={task} user={user} onSave={onSave} />
    </Sidebar>
  )
}

export function NewTaskSidebar({
  user,
  onDismiss,
  onSave,
}: {
  user?: Document<'users'> | null
  onDismiss: MouseEventHandler
  onSave: (taskInfo: Partial<Task>) => void
}) {
  const newTaskInfo = {
    status: Status.New,
    visibility: Visibility.PUBLIC,
    ownerId: user?._id,
  } as Partial<Document<'tasks'>>

  return (
    <Sidebar onDismiss={onDismiss}>
      <TaskDetails
        task={newTaskInfo as Task}
        user={user}
        newTask={true}
        onSave={onSave}
      />
    </Sidebar>
  )
}
