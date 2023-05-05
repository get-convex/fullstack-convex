import React, { useCallback, useContext } from 'react'
import Link from 'next/link'
import type { MouseEventHandler } from 'react'
import { Avatar } from './login'
import { StatusPill } from './status'
import { PaperClipIcon, TextBubbleIcon } from './icons'
import {
  AppData,
  BackendEnvironment,
  Task,
  TaskListOptions,
  User,
} from '../types'
import { BackendContext } from '../fullstack/backend'
import { DataContext } from '../fullstack/data'
import { userOwnsTask } from './helpers'

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
      onClick={onSelect}
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

export function TaskList({ options }: { options: TaskListOptions }) {
  const {
    taskManagement: { updateTask },
  } = useContext(BackendContext) as BackendEnvironment
  const data = useContext(DataContext) as AppData

  const {
    taskList: { value: tasks, isLoading },
    user: { value: user },
  } = data

  if (!isLoading && !tasks?.length) {
    return (
      <main className="task-list">
        <div id="task-list-body">
          <p>No matching tasks found</p>
        </div>
      </main>
    )
  } else {
    const sortHandler = isLoading ? () => ({}) : options.sort.onChange

    return (
      <main className="task-list">
        <div className="task-list-header">
          <div id="number" onClick={sortHandler} tabIndex={0}>
            #
          </div>
          <div id="title" onClick={sortHandler} tabIndex={0}>
            Task
          </div>
          <div id="status" onClick={sortHandler} tabIndex={0}>
            Status
          </div>
          <div id="owner" onClick={sortHandler} tabIndex={0}>
            Owner
          </div>
          <div id="fileCount" onClick={sortHandler} tabIndex={0}>
            Files
          </div>
          <div id="commentCount" onClick={sortHandler} tabIndex={0}>
            Comments
          </div>
        </div>
        <div id="task-list-body">
          {tasks &&
            tasks.length > 0 &&
            tasks.map((task) => (
              <TaskListing
                key={task.number}
                user={user}
                task={task}
                selected={task.number === options.selectedTask.number}
                onSelect={() => options.selectedTask.onChange(task.number)}
                onUpdate={updateTask}
              />
            ))}
          {isLoading && <TaskListingsGhost />}
        </div>
      </main>
    )
  }
}
