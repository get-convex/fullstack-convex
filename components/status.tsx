import React from 'react'
import { Status } from '../convex/schema'
import { CaretDown } from './icons'

export function StatusPill({
  value,
  height = 23,
  editable = false,
}: {
  value: Status
  height?: number
  editable?: boolean
}) {
  return (
    <div
      className={`status-pill status-pill-${value}${
        editable ? ' status-pill-editable' : ''
      }`}
      style={{ height }}
      onClick={editable ? (e) => console.log(e) : () => undefined}
    >
      {Status[value]} {editable && <CaretDown />}
    </div>
  )
}
