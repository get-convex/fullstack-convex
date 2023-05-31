import React from 'react'
import { Status, STATUS_VALUES } from '../fullstack/types'
import { RadioDropdown } from './dropdowns'

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
  return (
    <div
      id={`status-select status-pill status-pill-editable status-${value}`}
      style={{ height }}
    >
      <RadioDropdown
        name="status"
        selectedValue={value}
        options={STATUS_VALUES}
        labels={STATUS_VALUES.map((v) => Status[v])}
        onChange={onChange}
      />
    </div>
  )
}
