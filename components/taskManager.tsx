import React, { useContext, useMemo, useEffect } from 'react'
import NextError from 'next/error'
import Head from 'next/head'
import { Header } from './login'
import { Controls } from './controls'
import { TaskList } from './taskList'
import { NewTaskSidebar, TaskDetailSidebar } from './sidebar'
import { BackendContext } from '../fullstack/backend'
import { DataContext } from '../fullstack/data'
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

  const { onChange: changeSelectedTask } = options.selectedTask

  useEffect(() => {
    if (slug === 'new') changeSelectedTask(null)
  }, [slug, changeSelectedTask])

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

  const pageTitle =
    slug === 'new'
      ? 'New Task'
      : data.task.value
      ? data.task.value.title
      : 'Fullstack Task Manager'

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
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
            onDismiss={() => changeSelectedTask(null)}
            onCreate={(n) => changeSelectedTask(n)}
          />
        ) : (
          isSidebarOpen && (
            <TaskDetailSidebar onDismiss={() => changeSelectedTask(null)} />
          )
        )}
      </div>
    </>
  )
}
