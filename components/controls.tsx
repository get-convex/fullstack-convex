import React, { useState } from 'react'
import Link from 'next/link'
import { Status } from '../convex/schema'
import { CaretDown, CaretUp, Plus, Search } from './icons'
import type { ChangeEventHandler, KeyboardEventHandler } from 'react'
import type { Document } from '../convex/_generated/dataModel'

type Value = string | number | Status

interface FilterControl {
  options: Value[]
  labels?: string[]
  user?: Document<'users'> | null
  selected: Value[]
  onChange: ChangeEventHandler
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
          {showOptions ? <CaretUp /> : <CaretDown />}
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
  search,
}: {
  user: Document<'users'> | null | undefined
  filters: { status: FilterControl; owner: FilterControl }
  search: { term: string; onSubmit: (term: string) => void }
}) {
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
          user={user}
          options={filters.owner.options}
          labels={filters.owner.labels}
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

function SearchControl({
  searchTerm = '',
  onSubmit,
}: {
  onSubmit: (term: string) => void
  searchTerm?: string
}) {
  const [term, setTerm] = useState(searchTerm || '')
  const onSearch = onSubmit || ((term: string) => console.log(term.trim()))

  const onKeyUp = function (e) {
    if (e.key === 'Enter') onSearch(term)
  } as KeyboardEventHandler

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
        <Search />
      </button>
    </div>
  )
}
