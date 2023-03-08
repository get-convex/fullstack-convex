import React from 'react'
import type { PropsWithChildren, MouseEventHandler } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { CircledX } from './icons'
import { EditableTaskDetails, TaskDetails } from './taskDetails'
import { Status, Visibility } from '../convex/schema'
import type { Document } from '../convex/_generated/dataModel'
import type { Task } from '../convex/getTask'

export function Sidebar({
  onClose,
  children,
}: PropsWithChildren<{ onClose: MouseEventHandler }>) {
  return (
    <aside id="sidebar" role="dialog" aria-label="Task details">
      {children}
      <Link
        role="button"
        id="close-sidebar"
        className="icon-button"
        aria-label="Close task details"
        href="/"
        onClick={onClose}
      >
        <CircledX />
      </Link>
    </aside>
  )
}

export function TaskDetailSidebar({
  task,
  user,
  setSelectedTask,
}: {
  setSelectedTask: React.Dispatch<React.SetStateAction<number | null>>
  task?: Task | null
  user?: Document<'users'> | null
}) {
  return (
    <Sidebar onClose={() => setSelectedTask(null)}>
      <TaskDetails task={task} user={user} />
    </Sidebar>
  )
}

export function NewTaskSidebar({
  user,
  setSelectedTask,
}: {
  setSelectedTask: React.Dispatch<React.SetStateAction<number | null>>
  user?: Document<'users'> | null
}) {
  if (!user) throw new Error('You must be logged in to create a task')
  const newTaskInfo = {
    status: Status.New,
    visibility: Visibility.PUBLIC,
    ownerId: null,
  } as Partial<Document<'tasks'>>

  return (
    <Sidebar onClose={() => setSelectedTask(null)}>
      <EditableTaskDetails
        user={user}
        initialTaskInfo={newTaskInfo}
        mutationName="createTask"
        setSelectedTask={setSelectedTask}
      />
    </Sidebar>
  )
}
