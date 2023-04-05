import React, { useContext } from 'react'
import Head from 'next/head'
import NextError from 'next/error'
import { Inter } from 'next/font/google'
import { Header } from './login'
import { Controls } from './controls'
import { TaskList } from './taskList'
import { NewTaskSidebar, TaskDetailSidebar } from './sidebar'
import {
  BackendContext,
  DataContext,
  NewTaskInfo,
  TaskListOptions,
} from '../types'

const FONT = Inter({ subsets: ['latin'] })

export function TaskManager({
  slug,
  options,
}: {
  slug: number | 'new' | null
  options: TaskListOptions
}) {
  // Get backend context with functions to manipulate data
  const backend = useContext(BackendContext)
  // Get data context with loaded data to pass to components
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

  const pageTitle =
    slug === 'new'
      ? 'New Task'
      : data.task
      ? data.task.title
      : 'Fullstack Task Manager'

  const isSidebarOpen = !!slug

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <style>{`html { font-family: ${FONT.style.fontFamily}; }`}</style>
      </Head>
      <div
        id="app"
        className={`grid ${isSidebarOpen ? 'with-sidebar' : 'without-sidebar'}`}
      >
        <Header>
          <Controls
            search={{
              term: '',
              onSubmit: (term) => console.log('You searched for:', term),
            }}
            status={options.filter.status}
            owner={options.filter.owner}
          />
        </Header>
        <TaskList
          options={options}
          onUpdateTask={
            async (taskInfo) =>
              await backend.taskManagement.updateTask(taskInfo) // TODO pull into component
          }
        />
        {slug === 'new' ? (
          <NewTaskSidebar
            onDismiss={() => options.selectedTask?.onChange(null)}
          />
        ) : (
          isSidebarOpen && (
            <TaskDetailSidebar
              user={data.user}
              task={data.task}
              onDismiss={() => options.selectedTask?.onChange(null)}
            />
          )
        )}
      </div>
    </>
  )
}
