import { useState } from 'react'
import { SortKey, SortOrder } from '../types'
import type { MouseEventHandler, KeyboardEventHandler } from 'react' // TODO keyboard

export function useSort(): {
  key: SortKey
  order: SortOrder
  onChange: MouseEventHandler
} {
  // Set up state & handler for sorting by a given key (column)
  const [sortKey, setSortKey] = useState(SortKey.NUMBER)
  const [sortOrder, setSortOrder] = useState(SortOrder.ASC)
  const onChangeSort: MouseEventHandler = (event) => {
    event.stopPropagation()
    const target = event.target as HTMLElement
    const key = target.id
    if (sortKey === key) {
      // We are already sorting by this key, so a click indicates an order reversal
      setSortOrder(sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC)
    } else {
      setSortKey(key as SortKey)
      setSortOrder(SortOrder.ASC)
    }
  }

  return { key: sortKey, order: sortOrder, onChange: onChangeSort }
}
