import React from 'react'
import Link from 'next/link'
import { CircledXIcon } from './icons'
import { TaskDetails, NewTaskDetails } from './taskDetails'
import type { PropsWithChildren, MouseEventHandler } from 'react'

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
  onDismiss,
}: {
  onDismiss: MouseEventHandler
}) {
  return (
    <Sidebar onDismiss={onDismiss}>
      <TaskDetails />
    </Sidebar>
  )
}

export function NewTaskSidebar({
  onDismiss,
  onCreate,
}: {
  onDismiss: MouseEventHandler
  onCreate: (n: number) => void
}) {
  return (
    <Sidebar onDismiss={onDismiss}>
      <NewTaskDetails onCreate={onCreate} />
    </Sidebar>
  )
}
