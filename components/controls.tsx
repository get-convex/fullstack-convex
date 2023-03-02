import React, { type ChangeEventHandler } from 'react'
import Link from 'next/link'
import { Status, STATUS_VALUES } from '../convex/schema'
import { Plus } from './icons'
import type { Document } from '../convex/_generated/dataModel'

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

export function AddTaskButton({ user }: { user?: Document<'users'> | null }) {
  if (user === undefined) {
    return (
      <button className="ghost" id="new" disabled>
        New Task
      </button>
    )
  }
  return (
    <>
      {user ? (
        <Link href="/task/new">
          <button className="dark" id="new" title="Create a new task">
            <Plus />
            New Task
          </button>
        </Link>
      ) : (
        <button
          className="dark"
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

export function Controls({ user, statusFilter, handleChangeFilter }) {
  return (
    <div id="controls">
      <StatusControl
        statusFilter={statusFilter}
        handleChangeFilter={handleChangeFilter}
      />
      <AddTaskButton user={user} />
    </div>
  )
}

// TODO cleanup

function ShowingCount({
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

function SearchControl() {
  return (
    <div id="search">
      <input value="" onChange={() => null} placeholder="Search will be here" />
    </div>
  )
}
