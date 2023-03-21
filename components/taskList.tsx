import React from 'react'
import Link from 'next/link'
import type { MouseEventHandler } from 'react'
import { Avatar } from './login'
import { StatusPill } from './status'
import { PaperClip, TextBubble } from './icons'
import type { Document } from '../convex/_generated/dataModel'
import type { Task } from '../convex/getTask'

function TaskListing({
  user,
  task,
  selected = false,
  onSelect,
  onUpdate,
}: {
  user?: Document<'users'> | null
  task: Document<'tasks'>
  selected: boolean
  onSelect: MouseEventHandler
  onUpdate: (task: Partial<Task>) => void
}) {
  return (
    <Link
      href={`/task/${task.number}`}
      className={`task-listing${selected ? ` selected-task` : ''}`}
      key={task.number}
      onClick={onSelect}
      tabIndex={0}
    >
      <div className="task-listing-number">{task.number}</div>
      <div className="task-listing-title">{task.title}</div>
      <div className="task-listing-status">
        <StatusPill
          value={task.status}
          editable={!!user && user._id.equals(task.ownerId)}
          onChange={(status) => onUpdate({ ...task, status })}
        />
      </div>
      <div className="task-listing-owner">
        {task.owner && <Avatar user={task.owner} size={23} withName={true} />}
      </div>
      <div className="task-listing-fileCount">
        <PaperClip /> {task.fileCount}
      </div>
      <div className="task-listing-commentCount">
        <TextBubble /> {task.commentCount}
      </div>
    </Link>
  )
}

export function TaskListingsGhost() {
  return (
    <>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((key) => (
        <div className="task-listing" key={key}>
          <div className="task-listing-number ghost">..</div>
          <div className="task-listing-title ghost">......</div>
          <div className="task-listing-status ghost">......</div>
          <div className="task-listing-owner ghost">.....</div>
          <div className="task-listing-files ghost">..</div>
          <div className="task-listing-comments ghost">..</div>
        </div>
      ))}
    </>
  )
}

export function TaskList({
  user,
  tasks,
  isLoading,
  onChangeSort,
  selectedTask,
  onChangeSelected,
  onUpdateTask,
}: {
  user?: Document<'users'> | null
  tasks: Document<'tasks'>[]
  isLoading: boolean
  onChangeSort: MouseEventHandler
  selectedTask: number | null
  onChangeSelected: (taskNumber: number) => void
  onUpdateTask: (taskInfo: Partial<Task>) => void
}) {
  if (!tasks.length && !isLoading) {
    return <p>No matching tasks found</p>
  }

  const sortHandler = isLoading ? () => ({}) : onChangeSort

  return (
    <main className="task-list">
      <div className="task-list-header">
        <div id="number" onClick={sortHandler} tabIndex={0}>
          #
        </div>
        <div id="title" onClick={sortHandler} tabIndex={0}>
          Task
        </div>
        <div id="status" onClick={sortHandler} tabIndex={0}>
          Status
        </div>
        <div id="owner" onClick={sortHandler} tabIndex={0}>
          Owner
        </div>
        <div id="fileCount" onClick={sortHandler} tabIndex={0}>
          Files
        </div>
        <div id="commentCount" onClick={sortHandler} tabIndex={0}>
          Comments
        </div>
      </div>
      <div id="task-list-body">
        {tasks.length > 0 &&
          tasks.map((task) => (
            <TaskListing
              key={task.number}
              user={user}
              task={task}
              selected={task.number === selectedTask}
              onSelect={() => onChangeSelected(task.number)}
              onUpdate={onUpdateTask}
            />
          ))}
        {isLoading && <TaskListingsGhost />}
      </div>
    </main>
  )
}
