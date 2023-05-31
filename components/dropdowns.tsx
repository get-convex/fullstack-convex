import React, { useCallback, useState } from 'react'
import type {
  ChangeEventHandler,
  KeyboardEventHandler,
  FocusEventHandler,
} from 'react'
import { CaretDownIcon, CaretUpIcon } from './icons'

export function CheckboxDropdown<Value>({
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
  onChange: (newSelected: Value[]) => void
  labels?: string[]
  titles?: string[]
  disabled?: boolean[]
}) {
  const id = `checkbox-dropdown-${name}`
  const isSelected = (value: Value) => selectedValues.includes(value)
  const [editing, setEditing] = useState(false)
  const optionLabels = labels || options.map((o) => `${o}`)
  const numSelected = selectedValues.length

  const onKeyUp = function (e) {
    if (e.key === 'Escape') setEditing(false)
    if (e.key === 'Enter') setEditing(!editing)
  } as KeyboardEventHandler

  const onKeyDown = function (event) {
    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault()
    }
  } as KeyboardEventHandler

  const onBlur = function (e) {
    if (!e.relatedTarget?.className.startsWith(`checkbox-option`)) {
      setEditing(false)
    }
  } as FocusEventHandler

  const onValueChange = (v: Value, selected: boolean) => {
    const newSelected = selected
      ? // A formerly unchecked option is now checked; add value to selected
        options.filter((s) => selectedValues.includes(s) || s === v)
      : // A formerly checked option is now unchecked; remove value from selected
        selectedValues.filter((s) => s !== v)
    return onChange(newSelected)
  }

  const onInputChange = (v: Value) =>
    function (event) {
      const target = event.target as HTMLInputElement
      const value = (
        typeof v === 'number' ? +target.value : target.value
      ) as Value
      return onValueChange(value, target.checked)
    } as ChangeEventHandler

  const onInputKeyDown = function (event) {
    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault()
    }
  } as KeyboardEventHandler

  const onInputKeyUp = (v: Value) =>
    function (event) {
      if (event.key === 'Escape') {
        setEditing(false)
      }
      if (event.key === 'Enter') {
        const wasChecked = isSelected(v)
        const isNowChecked = !wasChecked
        return onValueChange(v, isNowChecked)
      }
    } as KeyboardEventHandler

  return (
    <div id={id} className="select">
      {
        <div
          className="control select-legend"
          title={`Filter tasks by ${name}`}
          onClick={() => setEditing(!editing)}
          tabIndex={0}
          role="button"
          onBlur={onBlur}
          onKeyUp={onKeyUp}
          onKeyDown={onKeyDown}
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
          {editing ? <CaretUpIcon /> : <CaretDownIcon />}
        </div>
      }
      {editing &&
        options.map((v, i) => {
          const isDisabled =
            // If a value for disabled has been explicitly provided, use it
            (disabled && disabled[i]) ||
            // To prevent de-selecting all values (resulting in empty task list),
            // if there is only a single item selected, disable de-selecting it
            (isSelected(v) && selectedValues.length === 1)

          return (
            <label
              className={`checkbox-option ${id}-option control select-option  ${
                isDisabled ? 'select-option-disabled' : ''
              }`}
              key={i}
              tabIndex={0}
              onBlur={onBlur}
              onClick={() => disabled || onInputChange(v)}
              onKeyDown={onInputKeyDown}
              onKeyUp={onInputKeyUp(v)}
              title={
                isDisabled
                  ? isSelected(v) && selectedValues.length === 1
                    ? 'At least one value must be selected'
                    : titles && titles[i]
                  : isSelected(v)
                  ? 'Uncheck to exclude these tasks'
                  : 'Check to include these tasks'
              }
            >
              <input
                type="checkbox"
                id={`checkbox-option-${v}`}
                className={`checkbox-option select-option ${id}-option-input`}
                name={name}
                value={`${v}`}
                checked={isSelected(v)}
                onChange={onInputChange(v)}
                tabIndex={-1}
                disabled={isDisabled}
              />
              {optionLabels[i]}
            </label>
          )
        })}
    </div>
  )
}

export function RadioDropdown<Value>({
  name,
  options,
  selectedValue,
  onChange,
  labels,
}: {
  name: string
  options: Value[]
  selectedValue: Value
  onChange: (value: Value) => void
  labels?: string[]
}) {
  const id = `radio-dropdown-${name}`
  const optionLabels = labels || options.map((o) => `${o}`)
  const selectedLabel = optionLabels[options.indexOf(selectedValue)]
  const [editing, setEditing] = useState(false)

  const onKeyDown = function (event) {
    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault()
    }
  } as KeyboardEventHandler

  const getKeyUpHandler = useCallback(
    function (s: Value) {
      return function (event) {
        if (event.key === 'Escape') {
          event.preventDefault()
          setEditing(false)
        }
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          onChange(s)
          setEditing(false)
        }
      } as KeyboardEventHandler
    },
    [onChange, setEditing]
  )

  return (
    <form id={id}>
      {editing ? (
        <div
          className="dropdown-options"
          onBlurCapture={(e) => {
            if (!e.relatedTarget?.className.startsWith('dropdown-option'))
              setEditing(false)
          }}
          onKeyDown={onKeyDown}
          role="menu"
        >
          {options.map((v, i) => (
            <label
              key={i}
              className={`dropdown-option ${name}-option ${name}-${v} dropdown-option-label`}
              tabIndex={0}
              role="menuitemradio"
              onKeyDown={onKeyDown}
              onKeyUp={getKeyUpHandler(v)}
            >
              <input
                type="radio"
                name={id}
                className={`dropdown-option-input`}
                value={`${v}`}
                onChange={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onChange(v)
                  setEditing(false)
                }}
                checked={v === selectedValue}
                tabIndex={-1}
              />
              {optionLabels[i]}
            </label>
          ))}
        </div>
      ) : (
        <button
          className={`dropdown`}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setEditing(!editing)
          }}
        >
          {selectedLabel} <CaretDownIcon />
        </button>
      )}
    </form>
  )
}
