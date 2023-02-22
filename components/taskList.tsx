import React from 'react'
import Link from 'next/link'
import { Avatar } from '../components/login'
import type { MouseEventHandler, ChangeEventHandler } from 'react'
import { Status, STATUS_VALUES, SortKey, SortOrder } from '../convex/schema'
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

export function TaskListings({
  tasks,
  handleChangeSort,
}: {
  tasks?: ListedTask[]
  handleChangeSort: MouseEventHandler
}) {
  return (
    <table>
      <thead>
        <tr id="column-headers">
          <th
            id="number"
            onClick={handleChangeSort}
            style={{ minWidth: '2ch' }}
          >
            #
          </th>
          <th id="title" onClick={handleChangeSort}>
            Task
          </th>
          <th id="owner" onClick={handleChangeSort}>
            Owner
          </th>
          <th id="status" onClick={handleChangeSort}>
            Status
          </th>
          <th id="comments" onClick={handleChangeSort}>
            Comments
          </th>
        </tr>
      </thead>
      <tbody>
        {tasks &&
          tasks.map((task) => <TaskListing key={task.number} task={task} />)}
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

export function SearchControl({}) {
  return (
    <div id="search">
      <input value="" onChange={() => null} placeholder="Search will be here" />
    </div>
  )
}
