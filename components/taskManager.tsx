import React, { useContext } from 'react'
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

  const isSidebarOpen = !!slug

  return (
    <>
      <div
        id="app"
        className={`grid ${isSidebarOpen ? 'with-sidebar' : 'without-sidebar'}`}
      >
        {
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
        }
        <TaskList
          options={options}
          onUpdateTask={
            async (taskInfo) =>
              await backend?.taskManagement.updateTask(taskInfo) // TODO pull into component
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
