import React from 'react'
import Link from 'next/link'
import type { MouseEventHandler } from 'react'
import { Status } from '../convex/schema'
import { Avatar } from '../components/login'
import { PaperClip, TextBubble, CaretDown } from './icons'
import type { ListedTask } from '../convex/listTasks'

function StatusPill({
  value,
  height = 23,
}: {
  value: Status
  height?: number
}) {
  return (
    <div className={`status-pill status-pill-${value}`} style={{ height }}>
      {Status[value]} <CaretDown />
    </div>
  )
}

function TaskListing({ task }: { task: ListedTask }) {
  return (
    <div className="task-listing" key={task.number}>
      <div className="task-listing-number">
        <Link href={`/task/${task.number}`}>{task.number}</Link>
      </div>
      <div className="task-listing-title">
        <Link href={`/task/${task.number}`}>{task.title}</Link>
      </div>
      <div className="task-listing-status">
        <StatusPill value={task.status} />
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
    </div>
  )
}

export function TaskListingsGhost() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((key) => (
        <tr key={key}>
          <td>
            <p className="ghost">00</p>
          </td>
          <td>
            <p className="ghost">..................................</p>
          </td>
          <td>
            <div
              className="ghost avatar-ghost"
              style={{ margin: '0px auto' }}
            />
          </td>
          <td>
            <p className="ghost">private</p>
          </td>
          <td>
            <p className="ghost">0</p>
          </td>
        </tr>
      ))}
    </>
  )
}

export function TaskList({
  tasks,
  isLoading,
  handleChangeSort,
}: {
  tasks: ListedTask[]
  isLoading: boolean
  handleChangeSort: MouseEventHandler
}) {
  if (!tasks.length && !isLoading) {
    return <p>No matching tasks found</p>
  }
  const sortHandler = isLoading ? () => ({}) : handleChangeSort
  return (
    <div className="task-list">
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
          tasks.map((task) => <TaskListing key={task.number} task={task} />)}
        {isLoading && <TaskListingsGhost />}
      </div>
    </div>
  )
}
