import React, { useContext, useMemo } from 'react'
import NextError from 'next/error'
import { Header } from './login'
import { Controls } from './controls'
import { TaskList } from './taskList'
import { NewTaskSidebar, TaskDetailSidebar } from './sidebar'
import { BackendContext, DataContext } from '../context'
import { TaskListOptions } from '../types'

export function TaskManager({
  slug,
  options,
}: {
  slug: number | 'new' | null
  options: TaskListOptions
}) {
  const isSidebarOpen = useMemo(() => !!slug, [slug])

  // Check that backend & data contexts are available
  const backend = useContext(BackendContext)
  const data = useContext(DataContext)

  if (!backend) {
    return (
      <NextError
        statusCode={500}
        title="No backend context provided!"
        withDarkMode={false}
      />
    )
  }

  if (!data) {
    return (
      <NextError
        statusCode={500}
        title="No data context provided!"
        withDarkMode={false}
      />
    )
  }

  return (
    <>
      <div
        id="app"
        className={`grid ${isSidebarOpen ? 'with-sidebar' : 'without-sidebar'}`}
      >
        {
          <Header>
            <Controls
              search={options.search}
              status={options.filter.status}
              owner={options.filter.owner}
            />
          </Header>
        }
        <TaskList options={options} />
        {slug === 'new' ? (
          <NewTaskSidebar
            onDismiss={() => options.selectedTask?.onChange(null)}
          />
        ) : (
          isSidebarOpen && (
            <TaskDetailSidebar
              onDismiss={() => options.selectedTask?.onChange(null)}
            />
          )
        )}
      </div>
    </>
  )
}
