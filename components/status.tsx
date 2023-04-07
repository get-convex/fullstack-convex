import React, { useCallback, useState } from 'react'
import { Status, STATUS_VALUES } from '../types'
import { CaretDownIcon } from './icons'
import type { KeyboardEvent } from 'react'

export function StatusPill({
  value,
  height = 20,
  editable = false,
  onChange,
}: {
  value: Status
  height?: number
  editable?: boolean
  onChange: (value: Status) => void
}) {
  const [editing, setEditing] = useState(false)

  const onKeyDown = useCallback(
    function (event: KeyboardEvent) {
      if (editing && event.key === 'Escape') {
        event.preventDefault()
        setEditing(false)
      }
      if (event.key === 'Enter') {
        event.preventDefault()
      }
    },
    [editing]
  )

  const onKeyUp = useCallback(
    function (event: KeyboardEvent) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        setEditing(!editing)
      }
    },
    [editing]
  )

  return editing ? (
    <StatusSelect
      value={value}
      onChange={(s) => {
        setEditing(false)
        onChange(s)
      }}
      onCancel={() => {
        setEditing(false)
      }}
    />
  ) : (
    <div
      role="button"
      className={`status-pill status-pill-${value}${
        editable ? ' status-pill-editable' : ''
      }`}
      style={{ height }}
      onClick={
        editable
          ? (e) => {
              e.preventDefault()
              setEditing(!editing)
            }
          : () => undefined
      }
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      tabIndex={0}
    >
      {Status[value]} {editable && <CaretDownIcon />}
    </div>
  )
}

function StatusSelect({
  value,
  onChange,
  onCancel,
}: {
  value: Status
  onChange: (value: Status) => void
  onCancel: () => void
}) {
  const onKeyDown = useCallback(
    function (event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
      if (event.key === 'Enter') {
        event.preventDefault()
      }
    },
    [onCancel]
  )

  const onKeyUp = useCallback(
    function (s: Status) {
      return function (event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          onChange(s)
        }
      }
    },
    [onChange]
  )

  return (
    <div id="status-select">
      {STATUS_VALUES.map((s) => (
        <div
          key={s}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp(s)}
          className={`status-pill status-pill-${s} status-pill-editable`}
          onClick={(e) => {
            e.preventDefault()
            onChange(s)
          }}
        >
          <input
            type="radio"
            name="status-select"
            id={`status-${s}`}
            value={s}
            onChange={() => {
              onChange(s)
            }}
            checked={s === value}
            tabIndex={-1}
            autoFocus={s === value}
          />
          <label className="status-label" htmlFor={`status-${s}`}>
            {Status[s]}
          </label>
        </div>
      ))}
    </div>
  )
}
