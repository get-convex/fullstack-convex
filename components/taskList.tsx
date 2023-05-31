import React, {
  useEffect,
  useState,
  type MouseEventHandler,
  type KeyboardEventHandler,
} from 'react'
import { Avatar } from './login'
import { StatusPill } from './status'
import {
  CaretDownIcon,
  CaretUpIcon,
  PaperClipIcon,
  TextBubbleIcon,
} from './icons'
import {
  SortOrder,
  type SortKey,
  type Task,
  type TaskListOptions,
} from '../fullstack/types'
import { useRouter } from 'next/router'

export function TaskListingsGhost() {
  return (
    <>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((key) => (
        <div className="task-listing" key={key}>
          <div className="task-listing-number ghost">..</div>
          <div className="task-listing-title ghost">......</div>
          <div className="task-listing-status ghost">......</div>
          <div className="task-listing-owner ghost">.....</div>
          <div className="task-listing-files ghost">..</div>
          <div className="task-listing-comments ghost">..</div>
        </div>
      ))}
    </>
  )
}

function TaskListing({
  task,
  selected = false,
  onSelect,
}: {
  task: Task
  selected: boolean
  onSelect: TaskListOptions['selectedTask']['onChange']
}) {
  const onClick = (() => {
    onSelect(task.number)
  }) as MouseEventHandler

  const onKeyDown = ((e) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault()
    }
  }) as KeyboardEventHandler

  const onKeyUp = ((e) => {
    e.preventDefault()
    if (selected && e.key === 'Escape') {
      onSelect(null)
    }
    if (!selected && e.key === 'Enter') {
      onSelect(task.number)
    }
  }) as KeyboardEventHandler

  return (
    <div
      key={task.number}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      tabIndex={0}
      role="link"
    >
      <div
        className={`task-listing${selected ? ` selected-task` : ''}`}
        role="row"
      >
        <div role="cell" className="task-listing-number">
          {task.number}
        </div>
        <div role="cell" className="task-listing-title">
          {task.title}
        </div>
        <div role="cell" className="task-listing-status">
          <StatusPill value={task.status} />
        </div>
        <div role="cell" className="task-listing-owner">
          {task.owner && <Avatar user={task.owner} size={23} withName={true} />}
        </div>
        <div role="cell" className="task-listing-fileCount">
          <PaperClipIcon /> {task.files.length}
        </div>
        <div role="cell" className="task-listing-commentCount">
          <TextBubbleIcon /> {task.comments.length}
        </div>
      </div>
    </div>
  )
}

function SortableColumnHeader({
  id,
  label,
  onChangeSort,
  sortOrder,
  isCurrentKey,
}: {
  id: string
  label: string
  onChangeSort: (key: SortKey) => void
  sortOrder: SortOrder
  isCurrentKey: boolean
}) {
  let title: string
  switch (id) {
    case 'fileCount':
    case 'commentCount':
      title = id.replace('C', ' c')
      break
    case 'owner':
      title = 'owner name'
      break
    default:
      title = id
  }

  const onClick = ((event) => {
    event.stopPropagation()
    const target = event.currentTarget as HTMLElement
    const key = target.id as SortKey
    return onChangeSort(key)
  }) as MouseEventHandler

  const onKeyDown = ((event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
    }
  }) as KeyboardEventHandler

  const onKeyUp = ((event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      const target = event.currentTarget as HTMLElement
      const sortKey = target.id as SortKey
      return onChangeSort(sortKey)
    }
  }) as KeyboardEventHandler

  return (
    <div
      id={id}
      title={`Sort tasks ${title} (${sortOrder}ending)`}
      role="columnheader"
      onClick={onClick}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      tabIndex={0}
    >
      {label}
      {isCurrentKey &&
        (sortOrder === SortOrder.DESC ? <CaretUpIcon /> : <CaretDownIcon />)}
    </div>
  )
}

export function TaskList({
  options,
  tasks,
  isLoading,
}: {
  options: TaskListOptions
  tasks: Task[] | null
  isLoading: boolean
}) {
  const router = useRouter()
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  useEffect(() => {
    if (!isLoading) setIsFirstLoad(false)
  }, [isLoading])

  const onChangeSort = options.sort.onChange
  const sortKey = options.sort.key as string
  const sortOrder = options.sort.order

  const onChangeSelected = (taskNumber: number | null) => {
    if (!taskNumber) {
      router.push('/')
    } else {
      router.push(`/task/${taskNumber}`)
    }
    options.selectedTask.onChange(taskNumber)
  }

  return (
    <main className="task-list">
      <div className="task-list-header">
        {[
          ['number', '#'],
          ['title', 'Task'],
          ['status', 'Status'],
          ['owner', 'Owner'],
          ['fileCount', 'Files'],
          ['commentCount', 'Comments'],
        ].map(([id, label]) => (
          <SortableColumnHeader
            key={id}
            id={id}
            label={label}
            onChangeSort={onChangeSort}
            sortOrder={sortOrder}
            isCurrentKey={sortKey === id}
          />
        ))}
      </div>
      <div id="task-list-body">
        {!tasks?.length ? (
          isFirstLoad ? (
            <TaskListingsGhost />
          ) : (
            <>
              <div className="task-listing">
                <p />
                <p>No matching tasks found {isLoading && <span>...</span>}</p>
              </div>
            </>
          )
        ) : (
          tasks.map((task) => (
            <TaskListing
              key={task.number}
              task={task}
              selected={task.number === options.selectedTask.number}
              onSelect={onChangeSelected}
            />
          ))
        )}
      </div>
    </main>
  )
}
