import React, { useState, useCallback, useMemo } from 'react'
import BackendProvider from '../../fullstack/backend'
import DataProvider from '../../fullstack/data'
import {
  Status,
  OWNER_VALUES,
  TaskListOptions,
  SortKey,
  SortOrder,
} from '../../fullstack/types'

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

  const [ownerFilter, setOwnerFilter] = useState(OWNER_VALUES)

  const filter = useMemo(
    () => ({
      status: {
        selected: statusFilter,
        onChange: (newStatus: Status[]) => setStatusFilter(newStatus),
      },
      owner: {
        selected: ownerFilter,
        onChange: (newOwner: string[]) => setOwnerFilter(newOwner),
      },
    }),
    [statusFilter, ownerFilter]
  )

  const [sortKey, setSortKey] = useState(SortKey.NUMBER)
  const [sortOrder, setSortOrder] = useState(SortOrder.DESC)
  const onChangeSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        // We are already sorting by this key, so a click indicates an order reversal
        setSortOrder(
          sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC
        )
      } else {
        setSortKey(key)
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
        <style>{`html { font-family: ${FONT.style.fontFamily}; }`}</style>
      </Head>
      <BackendProvider>
        <DataProvider taskNumber={taskNumber} taskListOptions={taskListOptions}>
          <div className={FONT.className}>
            <TaskManager
              slug={slug}
              options={
                taskListOptions // TODO move options into the TaskManager component?
              }
            />
          </div>
        </DataProvider>
      </BackendProvider>
    </>
  )
}

// Page slugs don't change based on data, so generate them statically
export async function getStaticProps({
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
    revalidate: 10,
  }
}

// Generate the known paths
export async function getStaticPaths() {
  return {
    paths: [{ params: { slug: ['task', 'new'] } }, { params: { slug: ['/'] } }],
    fallback: 'blocking', // dynamic paths (e.g. '/task/123') will be SSRed
  }
}
