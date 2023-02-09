import { useRef } from 'react'
import { useQuery, usePaginatedQuery } from '../convex/_generated/react'
import type { UseQueryForAPI, UsePaginatedQueryForAPI } from 'convex/react'
import type { API } from '../convex/_generated/api'

export const useStableQuery = ((name, ...args) => {
  const result = useQuery(name, ...args)
  const stored = useRef(result) // ref objects are stable between rerenders

  // result is only undefined while data is loading
  // if a freshly loaded result is available, use the ref to store it
  if (result !== undefined) {
    stored.current = result
  }

  return stored.current // undefined on first load, stale data while loading, fresh data after loading
}) as UseQueryForAPI<API>

export const useStablePaginatedQuery = ((name, options, ...args) => {
  const result = usePaginatedQuery(name, options, ...args)
  const { results, status, loadMore } = result
  const stored = useRef(results) // ref objects are stable between rerenders

  // If data is still loading, wait and do nothing
  // If data has finished loading, store the results array
  if (result.status !== 'LoadingMore') {
    stored.current = result.results
  }

  return {
    results: stored.current, // undefined on first load, stale data while loading, fresh data after loading
    status,
    loadMore,
  }
}) as UsePaginatedQueryForAPI<API>
