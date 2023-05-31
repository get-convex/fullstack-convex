import React, { KeyboardEventHandler, useCallback, useState } from 'react'
import { CaretDownIcon } from './icons'
import { Status, STATUS_VALUES } from '../fullstack/types'
import type { KeyboardEvent } from 'react'

export function StatusPill({
  value,
  height = 20,
}: {
  value: Status
  height?: number
}) {
  return (
    <div style={{ height }} className={`status-pill status-${value} `}>
      {Status[value]}
    </div>
  )
}

export function StatusPillEditable({
  value,
  height = 20,
  onChange,
}: {
  value: Status
  height?: number
  onChange: (value: Status) => void
}) {
  const [editing, setEditing] = useState(false)

  const onKeyDown = function (event) {
    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault()
    }
  } as KeyboardEventHandler

  const getKeyUpHandler = useCallback(
    function (s: Status) {
      return function (event: KeyboardEvent) {
        if (event.key === 'Escape') {
          event.preventDefault()
          setEditing(false)
        }
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          onChange(s)
          setEditing(false)
        }
      }
    },
    [onChange, setEditing]
  )

  return (
    <form id="status-select" style={{ height }}>
      {editing ? (
        <div
          className="status-options"
          onBlurCapture={(e) => {
            if (!e.relatedTarget?.className.startsWith('status-option'))
              setEditing(false)
          }}
          onKeyDown={onKeyDown}
          role="menu"
        >
          {STATUS_VALUES.map((s) => (
            <label
              key={s}
              className={`status-option status-${s}  status-label`}
              tabIndex={0}
              role="menuitemradio"
              onKeyDown={onKeyDown}
              onKeyUp={getKeyUpHandler(s)}
            >
              <input
                type="radio"
                name="status-select"
                className={`status-option-${s} status-input`}
                value={s}
                onChange={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onChange(s)
                  setEditing(false)
                }}
                checked={s === value}
                tabIndex={-1}
              />
              {Status[s]}
            </label>
          ))}
        </div>
      ) : (
        <button
          className={`status-pill status-${value} status-pill-editable`}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setEditing(!editing)
          }}
        >
          {Status[value]} <CaretDownIcon />
        </button>
      )}
    </form>
  )
}
