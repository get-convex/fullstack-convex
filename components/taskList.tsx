import React from 'react'
import Link from 'next/link'
import { Avatar } from '../components/login'
import type { MouseEventHandler } from 'react'
import { Status } from '../convex/schema'
import type { ListedTask } from '../convex/listTasks'

function TaskListing({ task }: { task: ListedTask }) {
  return (
    <tr key={task.number}>
      <td>
        <Link href={`/task/${task.number}`}>{task.number}</Link>
      </td>
      <td>
        <Link href={`/task/${task.number}`}>{task.title}</Link>
      </td>
      <td style={{ textAlign: 'center' }}>
        {task.owner && <Avatar user={task.owner} size={30} />}
      </td>
      <td>{Status[task.status]}</td>
      <td>{task.comments}</td>
    </tr>
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

export function TaskListings({
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
    <table>
      <thead>
        <tr id="column-headers">
          <th id="number" onClick={sortHandler} style={{ minWidth: '2ch' }}>
            #
          </th>
          <th id="title" onClick={sortHandler}>
            Task
          </th>
          <th id="owner" onClick={sortHandler}>
            Owner
          </th>
          <th id="status" onClick={sortHandler}>
            Status
          </th>
          <th id="comments" onClick={sortHandler}>
            Comments
          </th>
        </tr>
      </thead>
      <tbody>
        {tasks.length > 0 &&
          tasks.map((task) => <TaskListing key={task.number} task={task} />)}
        {isLoading && <TaskListingsGhost />}
      </tbody>
    </table>
  )
}
