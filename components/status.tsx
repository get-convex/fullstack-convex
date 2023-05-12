import React, { useCallback, useState } from 'react'
import { CaretDownIcon } from './icons'
import { Status, STATUS_VALUES } from '../fullstack/types'
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
      if (event.key === 'Escape') {
        event.preventDefault()
        setEditing(false)
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        if (editable) {
          setEditing(true)
        }
      }
    },
    [setEditing]
  )

  const getKeyUpHandler = useCallback(
    function (s: Status) {
      return function (event: KeyboardEvent) {
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
    <div
      id="status-select"
      role="button"
      style={{ height }}
      onClick={(e) => {
        e.stopPropagation()
        if (editable) {
          setEditing(true)
        }
      }}
      onKeyDown={onKeyDown}
    >
      {editing ? (
        <div
          className={'status-options'}
          onBlur={(e) => {
            e.stopPropagation()
            if (!e.relatedTarget?.className.startsWith('status-option'))
              setEditing(false)
          }}
          tabIndex={0}
        >
          {STATUS_VALUES.map((s) => (
            <div
              key={s}
              className={`status-option status-${s}`}
              tabIndex={0}
              // TODO
              onKeyDown={onKeyDown}
              onKeyUp={getKeyUpHandler(s)}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onChange(s)
                setEditing(false)
              }}
            >
              <label className="status-label">
                <input
                  type="radio"
                  name="status-select"
                  className="status-input"
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
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`status-pill status-${value}${
            editable ? ' status-pill-editable' : ''
          }`}
          tabIndex={editable ? 0 : -1}
        >
          {Status[value]} {editable && <CaretDownIcon />}
        </div>
      )}
    </div>
  )
}
