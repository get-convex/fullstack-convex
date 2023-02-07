import { useRef } from 'react'
import type { UsePaginatedQueryResult } from 'convex/react'

export function useStaleData<T>(result: T) {
  const stored = useRef<T>() // ref objects are stable between rerenders
  const previous = stored.current // remember previously stored value, if any

  // result is only undefined while data is loading
  // if a freshly loaded result is available, use the ref to store it
  if (result !== undefined) {
    stored.current = result
  }

  // return both the fresh & stale data so UI can choose what to show
  return [result, previous] as const
}

export function useStalePaginatedData<T>(
  paginationResult: UsePaginatedQueryResult<T>
) {
  const stored = useRef<T[]>() // ref objects are stable between rerenders
  const previousResults = stored.current // remember previously stored data, if any

  // If data is still loading, wait and do nothing
  // If data has finished loading, store the results array
  if (paginationResult.status !== 'LoadingMore') {
    stored.current = paginationResult.results
  }

  // return both the fresh paginationResult of shape { results, status, loadMore }
  // along with the {results} from the previous paginationResult
  // so that the UI can choose what to show
  return [paginationResult, previousResults] as const
}
