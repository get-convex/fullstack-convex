import { useQuery, usePaginatedQuery } from 'convex/react'
import { useRef } from 'react'

export const useStableQuery = ((queryFn, ...args) => {
  const result = useQuery(queryFn, ...args)
  const stored = useRef(result) // ref objects are stable between rerenders

  // result is only undefined while data is loading
  // if a freshly loaded result is available, use the ref to store it
  if (result !== undefined) {
    stored.current = result
  }

  return stored.current // undefined on first load, stale data while loading, fresh data after loading
}) as typeof useQuery

export const useStablePaginatedQuery = ((queryFn, args, options) => {
  const result = usePaginatedQuery(queryFn, args, options)
  const { results, status, isLoading, loadMore } = result
  const stored = useRef(results) // ref objects are stable between rerenders

  // If data is still loading, wait and do nothing
  // If data has finished loading, store the results array
  if (!isLoading) {
    stored.current = result.results
  }

  return {
    results: stored.current, // empty array on first load, stale data while loading, fresh data after loading
    status,
    isLoading,
    loadMore,
  }
}) as typeof usePaginatedQuery
