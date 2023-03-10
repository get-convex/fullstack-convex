import React from 'react'
import Link from 'next/link'
import type { MouseEventHandler } from 'react'
import { Avatar } from './login'
import { StatusPill } from './status'
import { PaperClip, TextBubble } from './icons'
import type { ListedTask } from '../convex/listTasks'
import type { Document } from '../convex/_generated/dataModel'

function TaskListing({
  user,
  task,
  selectedTask,
  handleSelectTask,
}: {
  user?: Document<'users'> | null
  task: ListedTask
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
      <div className="task-listing-files">
        <PaperClip /> 0{/*TODO */}
      </div>
      <div className="task-listing-comments">
        <TextBubble /> {task.comments}
      </div>
    </Link>
  )
}

export function TaskListingsGhost() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((key) => (
        <div key={key}>
          <p className="ghost">00</p>
          <p className="ghost">..................................</p>
          <div className="ghost avatar-ghost" style={{ margin: '0px auto' }} />
          {/* <p className="ghost">private</p>
            <p className="ghost">0</p> */}
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
  tasks: ListedTask[]
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
        <div id="files">
          {' '}
          {/*TODO support sorting*/}
          Files
        </div>
        <div id="comments" onClick={sortHandler}>
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
