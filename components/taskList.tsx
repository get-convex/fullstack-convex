import React, { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import type { MouseEventHandler } from 'react'
import { Avatar } from './login'
import { StatusPill } from './status'
import {
  CaretDownIcon,
  CaretUpIcon,
  PaperClipIcon,
  TextBubbleIcon,
} from './icons'
import {
  BackendEnvironment,
  Task,
  TaskListOptions,
  User,
} from '../fullstack/types'
import { BackendContext } from '../fullstack/backend'
import { userOwnsTask } from './helpers'
import { SortOrder } from '../fullstack/types'

function TaskListing({
  user,
  task,
  selected = false,
  onSelect,
  onUpdate,
}: {
  user?: User | null
  task: Task
  selected: boolean
  onSelect: MouseEventHandler
  onUpdate: BackendEnvironment['taskManagement']['updateTask']
}) {
  return (
    <Link
      href={`/task/${task.number}`}
      className={`task-listing${selected ? ` selected-task` : ''}`}
      key={task.number}
      onClick={(e) => {
        console.log('listing click', e)
        onSelect(e)
      }}
      onFocus={(e) => {
        console.log('listing focus', e)
      }}
      onBlur={(e) => {
        console.log('listing blur', e)
      }}
      tabIndex={0}
    >
      <div className="task-listing-number">{task.number}</div>
      <div className="task-listing-title">{task.title}</div>
      <div className="task-listing-status">
        <StatusPill
          value={task.status}
          editable={userOwnsTask(task, user ?? null)}
          onChange={(status) => onUpdate({ taskInfo: { ...task, status } })}
        />
      </div>
      <div className="task-listing-owner">
        {task.owner && <Avatar user={task.owner} size={23} withName={true} />}
      </div>
      <div className="task-listing-fileCount">
        <PaperClipIcon /> {task.files.length}
      </div>
      <div className="task-listing-commentCount">
        <TextBubbleIcon /> {task.comments.length}
      </div>
    </Link>
  )
}

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

function SortableColumnHeader({
  id,
  label,
  onClick,
  isSorted,
}: {
  id: string
  label: string
  onClick: MouseEventHandler
  isSorted: SortOrder | null
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
  return (
    <div
      id={id}
      onClick={onClick}
      title={
        isSorted
          ? `Tasks sorted by ${title} (${isSorted}ending)`
          : `Sort tasks by ${title}`
      }
      tabIndex={0}
    >
      {label}
      {isSorted &&
        (isSorted === SortOrder.DESC ? <CaretUpIcon /> : <CaretDownIcon />)}
    </div>
  )
}

export function TaskList({
  options,
  tasks,
  isLoading,
  user,
}: {
  options: TaskListOptions
  tasks: Task[] | null
  isLoading: boolean
  user: User | null
}) {
  const {
    taskManagement: { updateTask },
  } = useContext(BackendContext) as BackendEnvironment

  const [isFirstLoad, setIsFirstLoad] = useState(true)

  useEffect(() => {
    if (!isLoading) setIsFirstLoad(false)
  }, [isLoading])

  const sortHandler = options.sort.onChange
  const sortKey = options.sort.key as string
  const sortOrder = options.sort.order

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
            onClick={sortHandler}
            isSorted={sortKey === id ? sortOrder : null}
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
              user={user}
              task={task}
              selected={task.number === options.selectedTask.number}
              onSelect={() => options.selectedTask.onChange(task.number)}
              onUpdate={updateTask}
            />
          ))
        )}
      </div>
    </main>
  )
}
