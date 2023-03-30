import React from 'react'
import Link from 'next/link'
import { CircledXIcon } from './icons'
import { TaskDetails, NewTaskDetails } from './taskDetails'
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
        <CircledXIcon />
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
  return (
    <Sidebar onDismiss={onDismiss}>
      <NewTaskDetails user={user} onSave={onSave} />
    </Sidebar>
  )
}
