import React, { useCallback, useContext, useState } from 'react'
import Link from 'next/link'
import {
  Status,
  STATUS_VALUES,
  OWNER_VALUES,
  User,
  AppData,
  Filter,
} from '../types'
import { DataContext } from '../context'
import { CaretDownIcon, CaretUpIcon, PlusIcon, SearchIcon } from './icons'
import type { ChangeEventHandler, KeyboardEvent } from 'react'

type Value = string | number | Status

interface FilterControl {
  options: Value[]
  selected: Value[]
  onChange: ChangeEventHandler
  labels?: string[]
  titles?: string[]
  disabled?: boolean[]
}

export function Select({
  name,
  options,
  selectedValues,
  onChange,
  labels,
  titles,
  disabled,
}: {
  name: string
  options: Value[]
  selectedValues: Value[]
  onChange: ChangeEventHandler
  labels?: string[]
  titles?: string[]
  disabled?: boolean[]
}) {
  const id = `select-${name}`
  const isSelected = (value: Value) => selectedValues.includes(value)
  const [showOptions, setShowOptions] = useState(false)
  const optionLabels = labels || options
  const numSelected = selectedValues.length

  return (
    <div id={id} className="select" tabIndex={0} role="button">
      {
        <div
          className="control select-legend"
          onClick={() => setShowOptions(!showOptions)}
          title={`Filter tasks by ${name}`}
        >
          <p>
            {name}{' '}
            <span
              title={`${numSelected} value${
                numSelected === 1 ? '' : 's'
              } selected`}
            >
              ({numSelected})
            </span>
          </p>
          {showOptions ? <CaretUpIcon /> : <CaretDownIcon />}
        </div>
      }
      {showOptions &&
        options.map((v, i) => {
          const isDisabled = disabled
            ? // If a value for disabled has been explicitly provided, use it
              disabled[i]
            : // To prevent de-selecting all values (resulting in empty task list),
              // if there is only a single item selected, disable de-selecting it
              isSelected(v) && selectedValues.length === 1
          return (
            <label
              className={`control select-option ${
                isDisabled ? 'select-option-disabled' : ''
              }`}
              key={i}
              title={titles ? titles[i].toString() : optionLabels[i].toString()}
            >
              <input
                type="checkbox"
                id={`option-${v}`}
                name={name}
                value={v}
                checked={isSelected(v)}
                onChange={onChange}
                disabled={isDisabled}
                title={
                  isDisabled
                    ? isSelected(v) && selectedValues.length === 1
                      ? 'At least one value must be selected'
                      : titles && titles[i]
                    : isSelected(v)
                    ? 'Uncheck to exclude these tasks'
                    : 'Check to include these tasks'
                }
              />
              {optionLabels[i]}
            </label>
          )
        })}
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
  titles,
  disabled,
  selected,
  onChange,
}: FilterControl) {
  return (
    <Select
      name="Owner"
      options={options}
      selectedValues={selected}
      onChange={onChange}
      labels={labels || options.map((o) => o.toString())}
      titles={titles}
      disabled={disabled}
    />
  )
}

export function AddTaskButton({ user }: { user?: User | null }) {
  if (user === undefined) {
    return (
      <button className="ghost" id="new" disabled>
        <PlusIcon />
        Add Task
      </button>
    )
  }
  return (
    <>
      {user ? (
        <Link href="/task/new">
          <button className="dark" id="new" title="Create a new task">
            <PlusIcon />
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
          <PlusIcon />
          Add Task
        </button>
      )}
    </>
  )
}

export function Controls({
  status,
  owner,
  search,
}: {
  status: Filter<Status>
  owner: Filter<string>
  search: { term: string; onSubmit: (term: string) => void }
}) {
  const {
    user: { value: user },
  } = useContext(DataContext) as AppData

  const filters = {
    status: {
      options: STATUS_VALUES,
      labels: STATUS_VALUES.map((v) => Status[v]),
      titles: STATUS_VALUES.map((v) => `${Status[v]} tasks`),
      ...status,
    },
    owner: {
      options: OWNER_VALUES,
      selected: owner.selected.filter((v: string) =>
        v === 'Me' ? !!user : true
      ),
      onChange: owner.onChange,
      titles: [
        user ? `Tasks owned by ${user.name}` : 'Log in to see your own tasks',
        'Tasks owned by other users',
        'Tasks not owned by any user',
      ],
      disabled: OWNER_VALUES.map((v) => (v === 'Me' ? !user : false)),
    },
  }

  return (
    <div id="controls">
      <div>
        <StatusControl
          options={filters.status.options}
          labels={filters.status.labels}
          titles={filters.status.titles}
          disabled={filters.owner.disabled}
          selected={filters.status.selected}
          onChange={filters.status.onChange}
        />
        <OwnerControl
          options={filters.owner.options}
          titles={filters.owner.titles}
          disabled={filters.owner.disabled}
          selected={filters.owner.selected}
          onChange={filters.owner.onChange}
        />
        <SearchControl searchTerm={search.term} onSubmit={search.onSubmit} />
      </div>
      <AddTaskButton user={user} />
    </div>
  )
}

function SearchControl({
  searchTerm = '',
  onSubmit,
}: {
  onSubmit: (term: string) => void
  searchTerm?: string
}) {
  const [term, setTerm] = useState(searchTerm || '')

  const onKeyUp = useCallback(
    function (e: KeyboardEvent) {
      if (e.key === 'Enter') onSubmit(term)
    },
    [onSubmit, term]
  )

  return (
    <div id="search" className="control">
      <input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyUp={onKeyUp}
        placeholder="Search task titles, descriptions & comments"
        tabIndex={0}
      />
      <button
        type="submit"
        className="icon-button"
        title="Click to search"
        onClick={() => onSubmit(term)}
      >
        <SearchIcon />
      </button>
    </div>
  )
}
