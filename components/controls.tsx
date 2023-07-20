import React, { ChangeEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckboxDropdown } from './dropdowns'
import { PlusIcon, SearchIcon, CircledXIcon } from './icons'
import {
  Status,
  STATUS_VALUES,
  OWNER_VALUES,
  User,
  Filter,
} from '../fullstack/types'
import type { KeyboardEvent, FocusEvent } from 'react'

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
  status: Filter<Status>
  owner: Filter<string>
  search: { term: string; onChange: (term: string) => void }
  user: User | null
}) {
  const filters = {
    status: {
      options: STATUS_VALUES,
      labels: STATUS_VALUES.map((v) => Status[v]),
      titles: STATUS_VALUES.map((v) => `${Status[v]} tasks`),
      selected: status.selected,
      onChange: status.onChange,
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

  const StatusFilterControl = CheckboxDropdown<Status>
  const OwnerFilterControl = CheckboxDropdown<string>

  return (
    <div id="controls">
      <div>
        <StatusFilterControl
          name="Status"
          options={filters.status.options}
          labels={filters.status.labels}
          titles={filters.status.titles}
          selectedValues={filters.status.selected}
          onChange={filters.status.onChange}
        />
        <OwnerFilterControl
          name="Owner"
          options={filters.owner.options}
          titles={filters.owner.titles}
          disabled={filters.owner.disabled}
          selectedValues={filters.owner.selected}
          onChange={filters.owner.onChange}
        />
        <SearchControl searchTerm={search.term} onChange={search.onChange} />
      </div>
      <AddTaskButton user={user} />
    </div>
  )
}
