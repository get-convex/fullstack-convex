import React from 'react'
import Link from 'next/link'
import type { MouseEventHandler } from 'react'
import { Avatar } from './login'
import { StatusPill } from './status'
import { PaperClip, TextBubble } from './icons'
import type { Document } from '../convex/_generated/dataModel'

function TaskListing({
  user,
  task,
  selectedTask,
  handleSelectTask,
}: {
  user?: Document<'users'> | null
  task: Document<'tasks'>
  selectedTask: number | null
  handleSelectTask: MouseEventHandler
}) {
  return (
    <Link
      href={`/task/${task.number}`}
      className={`task-listing${
        task.number === selectedTask ? ` selected-task` : ''
      }`}
      key={task.number}
      onClick={handleSelectTask}
    >
      <div className="task-listing-number">{task.number}</div>
      <div className="task-listing-title">{task.title}</div>
      <div className="task-listing-status">
        <StatusPill
          value={task.status}
          editable={!!user && user._id.equals(task.ownerId)}
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
  handleChangeSort,
  selectedTask,
  setSelectedTask,
}: {
  user?: Document<'users'> | null
  tasks: Document<'tasks'>[]
  isLoading: boolean
  handleChangeSort: MouseEventHandler
  selectedTask: number | null
  setSelectedTask: React.Dispatch<React.SetStateAction<number | null>>
}) {
  if (!tasks.length && !isLoading) {
    return <p>No matching tasks found</p>
  }

  const sortHandler = isLoading ? () => ({}) : handleChangeSort

  return (
    <main className="task-list">
      <div className="task-list-header">
        <div id="number" onClick={sortHandler}>
          #
        </div>
        <div id="title" onClick={sortHandler}>
          Task
        </div>
        <div id="status" onClick={sortHandler}>
          Status
        </div>
        <div id="owner" onClick={sortHandler}>
          Owner
        </div>
        <div id="fileCount" onClick={sortHandler}>
          Files
        </div>
        <div id="commentCount" onClick={sortHandler}>
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
              selectedTask={selectedTask}
              handleSelectTask={() => setSelectedTask(task.number)}
            />
          ))}
        {isLoading && <TaskListingsGhost />}
      </div>
    </main>
  )
}
