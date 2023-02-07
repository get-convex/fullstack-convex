import { NamedQuery, QueryNames } from 'convex/api'
import { UsePaginatedQueryResult } from 'convex/react'
import { useRef } from 'react'
import { API } from '../convex/_generated/api'

export function useStableData<T>(result: T) {
  const stored = useRef<T>() // ref objects are stable between rerenders
  const previous = stored.current // remember previously stored value, if any
  if (result !== undefined) {
    // result is only undefined while query is loading
    // if fresh result has finished loading, use the ref to store it
    stored.current = result
  }
  // // return both fresh & stale data so UI can choose between them
  // return [result, previous] as const

  return result ?? previous // only undefined on first load
}

export function useStablePaginatedData(
  result: UsePaginatedQueryResult<ReturnType<NamedQuery<API, QueryNames<API>>>>
) {
  const stored = useRef<typeof result.results>() // ref objects are stable between rerenders
  const previous = stored.current // remember previously stored data, if any
  if (result.results?.length) {
    stored.current = result.results // if we have fresh non-empty results, store that data
  }
  // result is the fresh UsePaginatedQueryResult with shape { results, status, loadMore }
  // previous is the stale results array from the last UsePaginatedQueryResult
  // // return both so that the UI can choose what to do with them
  // return [result, previous] as const

  const data = result.results ?? previous
  const { status, loadMore } = result

  return [data, status, loadMore] as const
}
