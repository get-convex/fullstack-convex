import { UsePaginatedQueryResult } from 'convex/react'
import { useRef } from 'react'

export function useStableData<T>(result: T) {
  const stored = useRef<T>() // ref objects are stable between rerenders

  // result is only undefined while data is loading
  // if a freshly loaded result is available, use the ref to store it
  if (result !== undefined) {
    stored.current = result
  }

  return stored.current // undefined on first load, stale data while loading, fresh data after loading
}

export function useStablePaginatedData<T>(result: UsePaginatedQueryResult<T>) {
  const stored = useRef<T[]>() // ref objects are stable between rerenders

  // If data is still loading, wait and do nothing
  // If data has finished loading, store the results array
  if (result.status !== 'LoadingMore') {
    stored.current = result.results
  }

  const data = stored.current // undefined on first load, stale data while loading, fresh data after loading
  const { status, loadMore } = result // pass on the current loading status & loadMore fn

  return [data, status, loadMore] as const
}
