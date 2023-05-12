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
        setEditing(editable)
      }
    },
    [editable]
  )

  const onKeyUp = useCallback(function (event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
    }
  }, [])

  // const onKeyDown = useCallback(
  //   function (event: KeyboardEvent) {
  //     if (event.key === 'Escape') {
  //       event.preventDefault()
  //       onCancel()
  //     }
  //     if (event.key === 'Enter') {
  //       event.preventDefault()
  //     }
  //   },
  //   [onCancel]
  // )

  // const onKeyUp = useCallback(
  //   function (s: Status) {
  //     return function (event: KeyboardEvent) {
  //       if (event.key === 'Enter' && !event.shiftKey) {
  //         event.preventDefault()
  //         onChange(s)
  //       }
  //     }
  //   },
  //   [onChange]
  // )

  return (
    <div
      id="status-select"
      role="button"
      style={{ height }}
      onFocus={(e) => {
        e.stopPropagation()
        if (editable) {
          setEditing(true)
        }
      }}
      // TODO
      // onKeyDown={onKeyDown}
      // onKeyUp={onKeyUp}
      tabIndex={0}
    >
      {editing ? (
        <div
          className={'status-options'}
          onBlur={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setEditing(false)
          }}
        >
          {STATUS_VALUES.map((s) => (
            <div
              key={s}
              className={`status-option status-${s}`}
              tabIndex={0}
              // TODO
              // onKeyDown={onKeyDown}
              // onKeyUp={onKeyUp}
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
        >
          {Status[value]} {editable && <CaretDownIcon />}
        </div>
      )}
    </div>
  )
}
