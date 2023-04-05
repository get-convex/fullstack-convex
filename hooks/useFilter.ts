import { useState, type ChangeEventHandler } from 'react'

export function useFilter<T>(
  possibleValues: T[],
  initialValues: T[]
): { selected: T[]; onChange: ChangeEventHandler } {
  const [selectedValues, setSelectedValues] = useState(initialValues)

  const onChange: ChangeEventHandler = (event) => {
    const target = event.target as HTMLInputElement
    const { value, checked } = target
    const newFilter = checked
      ? // A formerly unchecked option is now checked; add value to filter
        possibleValues.filter((o) => selectedValues.includes(o) || o === value)
      : // A formerly checked option is now unchecked; remove value from filter
        selectedValues.filter((s) => s !== value)
    setSelectedValues(newFilter)
  }

  return { selected: selectedValues, onChange }
}
