import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  MouseEvent,
  useMemo,
  useContext,
  type PropsWithChildren,
  type ChangeEvent,
} from 'react'
import Backend from '../../fullstack/backend'
import Data from '../../fullstack/data'
import {
  Status,
  STATUS_VALUES,
  OWNER_VALUES,
  AppData,
  TaskListOptions,
  SortKey,
  SortOrder,
  User,
} from '../../types'

import { TaskManager } from '../../components/taskManager'
import Head from 'next/head'
import { Inter } from 'next/font/google'

const FONT = Inter({ subsets: ['latin'] })

export default function App({ slug }: { slug: number | 'new' | null }) {
  const [taskNumber, setTaskNumber] = useState(
    typeof slug === 'number' ? slug : null
  )

  const [statusFilter, setStatusFilter] = useState([
    Status.New,
    Status['In Progress'],
  ])
  const onChangeStatus = useCallback(
    (event: ChangeEvent) => {
      const target = event.target as HTMLInputElement
      const { value, checked } = target
      const newFilter = checked
        ? // A formerly unchecked option is now checked; add value to filter
          STATUS_VALUES.filter((s) => statusFilter.includes(s) || s === +value)
        : // A formerly checked option is now unchecked; remove value from filter
          statusFilter.filter((s) => s !== +value)
      setStatusFilter(newFilter)
      return null
    },
    [statusFilter]
  )

  const [ownerFilter, setOwnerFilter] = useState(OWNER_VALUES)
  const onChangeOwner = useCallback(
    (event: ChangeEvent) => {
      const target = event.target as HTMLInputElement
      const { value, checked } = target
      const newFilter = checked
        ? // A formerly unchecked option is now checked; add value to filter
          OWNER_VALUES.filter((s) => ownerFilter.includes(s) || s === value)
        : // A formerly checked option is now unchecked; remove value from filter
          ownerFilter.filter((s) => s !== value)
      setOwnerFilter(newFilter)
      return null
    },
    [ownerFilter]
  )

  const filter = useMemo(
    () => ({
      status: {
        selected: statusFilter,
        onChange: onChangeStatus,
      },
      owner: {
        selected: ownerFilter,
        onChange: onChangeOwner,
      },
    }),
    [statusFilter, onChangeStatus, ownerFilter, onChangeOwner]
  )

  const [sortKey, setSortKey] = useState(SortKey.NUMBER)
  const [sortOrder, setSortOrder] = useState(SortOrder.DESC)
  const onChangeSort = useCallback(
    (event: MouseEvent) => {
      // TODO keyboard
      event.stopPropagation()
      const target = event.target as HTMLElement
      const key = target.id
      if (sortKey === key) {
        // We are already sorting by this key, so a click indicates an order reversal
        setSortOrder(
          sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC
        )
      } else {
        setSortKey(key as SortKey)
        setSortOrder(SortOrder.ASC)
      }
    },
    [sortKey, sortOrder]
  )

  const [searchTerm, setSearchTerm] = useState('')

  const search = useMemo(
    () => ({
      term: searchTerm,
      onChange: setSearchTerm,
    }),
    [searchTerm]
  )

  const taskListOptions = {
    filter,
    sort: { key: sortKey, order: sortOrder, onChange: onChangeSort },
    selectedTask: {
      number: taskNumber,
      onChange: setTaskNumber,
    },
    search,
  } as TaskListOptions

  return (
    <>
      <Head>
        {/* <title>{pageTitle}</title> */}
        <style>{`html { font-family: ${FONT.style.fontFamily}; }`}</style>
      </Head>
      <Backend>
        <Data taskNumber={taskNumber} taskListOptions={taskListOptions}>
          <div className={FONT.className}>
            <TaskManager
              slug={slug}
              options={
                taskListOptions // TODO move options into the TaskManager component?
              }
            />
          </div>
        </Data>
      </Backend>
    </>
  )
}

export async function getServerSideProps({
  params,
}: {
  params: { slug?: string[] }
}) {
  // Capture the dynamic route segment [[..slug]] (trickier to do client side)
  const [, slug] = params.slug || []
  let pageSlug = slug as number | 'new' | null
  if (!Number.isNaN(+slug)) {
    pageSlug = +slug
  } else if (!slug) {
    pageSlug = null
  }

  return {
    props: { slug: pageSlug },
  }
}
