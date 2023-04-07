import React, { useContext } from 'react'
import Link from 'next/link'
import { CircledXIcon } from './icons'
import { TaskDetails, NewTaskDetails } from './taskDetails'
import type { PropsWithChildren, MouseEventHandler } from 'react'
import { Task, User } from '../types'
import { DataContext } from '../context'

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
}: {
  onDismiss: MouseEventHandler
}) {
  return (
    <Sidebar onDismiss={onDismiss}>
      <NewTaskDetails />
    </Sidebar>
  )
}
