import React from 'react'
import Link from 'next/link'
import { Avatar } from '../components/login'
import type { MouseEventHandler, ChangeEventHandler } from 'react'
import { Status, STATUS_VALUES } from '../convex/schema'
import type { ListedTask } from '../convex/listTasks'
import type { Document } from '../convex/_generated/dataModel'

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

export function StatusControl({
  statusFilter,
  handleChangeFilter,
}: {
  statusFilter: Status[]
  handleChangeFilter: ChangeEventHandler
}) {
  return (
    <div id="filters">
      {STATUS_VALUES.map((status) => (
        <label key={`filter-${status}`}>
          <input
            key={status}
            type="checkbox"
            id={`filter-${status}`}
            value={status}
            onChange={handleChangeFilter}
            checked={statusFilter.includes(status)}
          />
          {Status[status]}
        </label>
      ))}
    </div>
  )
}

export function ShowingCount({
  isLoading,
  showing,
  matching,
}: {
  isLoading: boolean
  showing?: number
  matching?: number
}) {
  return (
    <span id="showing">
      {isLoading
        ? '... ' // TODO should be a loading spinner or such
        : ''}
      {matching !== undefined &&
        `Showing ${showing} of ${matching} task${matching === 1 ? '' : 's'}`}
    </span>
  )
}

export function NewTaskButton({ user }: { user?: Document<'users'> | null }) {
  if (user === undefined) {
    return (
      <button className="pill-button ghost" id="new" disabled>
        New Task
      </button>
    )
  }
  return (
    <>
      {user ? (
        <Link href="/task/new">
          <button className="pill-button" id="new">
            New Task
          </button>
        </Link>
      ) : (
        <button
          className="pill-button"
          id="new"
          title="Log in to create new tasks"
          disabled
        >
          New Task
        </button>
      )}
    </>
  )
}

export function SearchControl() {
  return (
    <div id="search">
      <input value="" onChange={() => null} placeholder="Search will be here" />
    </div>
  )
}
