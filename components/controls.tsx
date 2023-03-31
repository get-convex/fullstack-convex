import React, { useState, type ChangeEventHandler } from 'react'
import Link from 'next/link'
import { CaretDown, CaretUp, Plus } from './icons'
import { Status, User } from './types'

type Value = string | number | Status

interface FilterControl {
  options: Value[]
  labels?: string[]
  user?: User | null
  selected: Value[]
  onChange: ChangeEventHandler
}

export function Select({
  name,
  options,
  selectedValues,
  onChange,
  labels,
}: {
  name: string
  options: Value[]
  selectedValues: Value[]
  onChange: ChangeEventHandler
  labels?: string[]
}) {
  const id = `select-${name}`
  const isSelected = (value: Value) => selectedValues.includes(value)
  const [showOptions, setShowOptions] = useState(false)
  const optionLabels = labels || options
  return (
    <div id={id} className="select" tabIndex={0} role="button">
      {
        <div
          className="select-legend"
          onClick={() => setShowOptions(!showOptions)}
        >
          <p>
            <span>{name}</span> ({selectedValues.length})
          </p>
          {showOptions ? <CaretUp /> : <CaretDown />}
        </div>
      }
      {showOptions &&
        options.map((v, i) => (
          <div className="select-option" key={i}>
            <input
              type="checkbox"
              id={`option-${v}`}
              name={name}
              value={v}
              checked={isSelected(v)}
              onChange={onChange}
              disabled={isSelected(v) && selectedValues.length === 1}
            />
            <label htmlFor={`option-${v}`}>{optionLabels[i]}</label>
          </div>
        ))}
    </div>
  )
}

export function StatusControl({
  options,
  labels,
  selected,
  onChange,
}: FilterControl) {
  return (
    <Select
      name="Status"
      options={options}
      selectedValues={selected}
      onChange={onChange}
      labels={labels}
    />
  )
}

export function OwnerControl({
  options,
  labels,
  user,
  selected,
  onChange,
}: FilterControl) {
  return (
    <Select
      name="Owner"
      options={options} //['me', 'nobody', 'anyone']}
      selectedValues={selected}
      onChange={onChange}
      labels={labels || options.map((o) => o.toString())}
    />
  )
}

export function AddTaskButton({ user }: { user?: User | null }) {
  if (user === undefined) {
    return (
      <button className="ghost" id="new" disabled>
        <Plus />
        Add Task
      </button>
    )
  }
  return (
    <>
      {user ? (
        <Link href="/task/new">
          <button className="dark" id="new" title="Create a new task">
            <Plus />
            Add Task
          </button>
        </Link>
      ) : (
        <button
          className="dark"
          id="new"
          title="Log in to create new tasks"
          disabled
        >
          <Plus />
          Add Task
        </button>
      )}
    </>
  )
}

export function Controls({
  user,
  filters,
}: {
  user: User | null | undefined
  filters: { status: FilterControl; owner: FilterControl }
}) {
  return (
    <div id="controls">
      <div>
        <StatusControl
          options={filters.status.options}
          labels={filters.status.labels}
          selected={filters.status.selected}
          onChange={filters.status.onChange}
        />
        <OwnerControl
          user={user}
          options={filters.owner.options}
          labels={filters.owner.labels}
          selected={filters.owner.selected}
          onChange={filters.owner.onChange}
        />
      </div>
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
