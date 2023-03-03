import React, { useState, type ChangeEventHandler } from 'react'
import Link from 'next/link'
import { Status, STATUS_VALUES } from '../convex/schema'
import { CaretDown, CaretUp, Plus } from './icons'
import type { Document } from '../convex/_generated/dataModel'

type Value = string | number | Status

interface FilterControl {
  selected: Value[]
  onChange: ChangeEventHandler
}

function Select({
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
    <div id={id} className="select">
      {
        <div
          className="select-legend"
          onClick={() => setShowOptions(!showOptions)}
        >
          {name} {showOptions ? <CaretUp /> : <CaretDown />}
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
            />
            <label htmlFor={`option-${v}`}>{optionLabels[i]}</label>
          </div>
        ))}
    </div>
  )
}

export function StatusControl({ selected, onChange }: FilterControl) {
  return (
    <Select
      name="Status"
      options={STATUS_VALUES}
      selectedValues={selected}
      onChange={onChange}
      labels={STATUS_VALUES.map((v) => Status[v])}
    />
  )
}

export function OwnerControl({ selected, onChange }: FilterControl) {
  return (
    <Select
      name="Owner"
      options={['me', 'nobody', 'anyone']}
      selectedValues={selected}
      onChange={onChange}
    />
  )
}

export function AddTaskButton({ user }: { user?: Document<'users'> | null }) {
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
  user: Document<'users'> | null | undefined
  filters: { status: FilterControl; owner: FilterControl }
}) {
  return (
    <div id="controls">
      <div>
        <StatusControl
          selected={filters.status.selected}
          onChange={filters.status.onChange}
        />
        <OwnerControl
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
