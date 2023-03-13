import React from 'react'
import type { PropsWithChildren, MouseEventHandler } from 'react'
import Link from 'next/link'
import { CircledX } from './icons'
import { TaskDetails } from './taskDetails'
import { Status, Visibility } from '../convex/schema'
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
}: {
  onDismiss: MouseEventHandler
  task?: Task | null
  user?: Document<'users'> | null
}) {
  return (
    <Sidebar onDismiss={onDismiss}>
      <TaskDetails task={task} user={user} />
    </Sidebar>
  )
}

export function NewTaskSidebar({
  user,
  onDismiss,
  onSave,
}: {
  onDismiss: MouseEventHandler
  onSave: (taskID: number) => void
  user?: Document<'users'> | null
}) {
  if (!user) throw new Error('You must be logged in to create a task')
  const newTaskInfo = {
    title: 'New task title',
    status: Status.New,
    visibility: Visibility.PUBLIC,
    ownerId: user._id,
  } as Partial<Document<'tasks'>>

  return (
    <Sidebar onDismiss={onDismiss}>
      <TaskDetails task={newTaskInfo as Task} user={user} />
    </Sidebar>
  )
}
