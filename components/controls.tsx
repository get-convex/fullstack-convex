import React, { ChangeEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Status,
  STATUS_VALUES,
  OWNER_VALUES,
  User,
  Filter,
} from '../fullstack/types'
import {
  CaretDownIcon,
  CaretUpIcon,
  PlusIcon,
  SearchIcon,
  CircledXIcon,
} from './icons'
import type { ChangeEventHandler, KeyboardEvent, FocusEvent } from 'react'

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

  // TODO keyboard handler

  return (
    <div
      id={id}
      className="select"
      tabIndex={0}
      role="button"
      onBlur={(e) => {
        if (!e.relatedTarget?.className.startsWith(`select-${id}-option`)) {
          setShowOptions(false)
        }
      }}
      onFocus={() => {
        setShowOptions(true)
      }}
    >
      {
        <div
          className="control select-legend"
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
          const isDisabled =
            // If a value for disabled has been explicitly provided, use it
            (disabled && disabled[i]) ||
            // To prevent de-selecting all values (resulting in empty task list),
            // if there is only a single item selected, disable de-selecting it
            (isSelected(v) && selectedValues.length === 1)
          return (
            <label
              className={`select-${id}-option control select-option  ${
                isDisabled ? 'select-option-disabled' : ''
              }`}
              key={i}
              title={titles ? titles[i].toString() : optionLabels[i].toString()}
            >
              <input
                type="checkbox"
                id={`option-${v}`}
                className={`select-${id}-option-input`}
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

function SearchControl({
  searchTerm,
  onChange,
}: {
  onChange: (term: string) => void
  searchTerm: string
}) {
  const [term, setTerm] = useState(searchTerm || '')

  const onChangeText = useCallback((text: string) => setTerm(text), [])
  const onClearText = useCallback(() => {
    setTerm('')
    onChange('')
  }, [onChange])

  const onSubmit = useCallback(() => {
    onChange(term)
  }, [onChange, term])

  const onChangeInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChangeText(e.target.value)
    },
    [onChangeText]
  )

  const onBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      onChangeText(e.target.value)
      onSubmit()
    },
    [onChangeText, onSubmit]
  )

  const onKeyUp = useCallback(
    function (e: KeyboardEvent) {
      if (e.key === 'Enter') onSubmit()
    },
    [onSubmit]
  )

  // Search on term change (debounced)
  useEffect(() => {
    const debounced = setTimeout(() => onSubmit(), 300)
    return () => clearTimeout(debounced)
  }, [onSubmit])

  return (
    <div
      id="search"
      className="control"
      title="Search tasks by title, description, owner name, or comment text"
    >
      <input
        type="search"
        value={term}
        onChange={onChangeInput}
        onKeyUp={onKeyUp}
        onBlur={onBlur}
        placeholder="Search tasks"
        tabIndex={0}
      />
      {term && (
        <button
          className="icon-button"
          title="Clear text"
          onClick={onClearText}
        >
          <CircledXIcon />
        </button>
      )}
      <button type="submit" className="icon-button" onClick={onSubmit}>
        <SearchIcon />
      </button>
    </div>
  )
}

export function Controls({
  status,
  owner,
  search,
  user,
}: {
  status: Filter<Status, ChangeEventHandler>
  owner: Filter<string, ChangeEventHandler>
  search: { term: string; onChange: (term: string) => void }
  user: User | null
}) {
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
        <SearchControl searchTerm={search.term} onChange={search.onChange} />
      </div>
      <AddTaskButton user={user} />
    </div>
  )
}
