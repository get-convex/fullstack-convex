import React from 'react'
import Link from 'next/link'
import { useQuery, useMutation } from '../../../convex/_generated/react'
import { HeaderWithLogin, Avatar } from '../../../components/login'
import { Comments } from '../../../components/comments'
import { Visibility } from '../../../convex/schema'
import type { Task } from '../../../convex/getTask'

export default function TaskDetailPage({ taskNumber }: { taskNumber: number }) {
  const user = useQuery('getCurrentUser')
  const task = useQuery('getTask', taskNumber)
  const updateTask = useMutation('updateTask')

  function handleClaimTask() {
    const taskInfo = { ...task, ownerId: user?._id } as Partial<Task>
    saveChanges(taskInfo)
  }

  function handleUnclaimTask() {
    const taskInfo = { ...task, ownerId: null, owner: null }
    saveChanges(taskInfo)
  }

  function saveChanges(taskInfo: Partial<Task>) {
    delete taskInfo.owner // Un-join with owner object
    updateTask(taskInfo)
  }

  if (!task) {
    return (
      <main>
        <h1>Task not found</h1>
      </main>
    )
  }

  const isPublic = task.visibility === Visibility.PUBLIC
  const isOwner = user && user._id.equals(task.ownerId)
  const canChangeOwner = user && isPublic
  return (
    <main>
      <HeaderWithLogin user={user} />
      <div id="task-details">
        <div id="task-header">
          <h2>
            <span>#{task.number}</span>
            {task.title}
          </h2>
          <div>
            {canChangeOwner && (
              <button
                className="pill-button"
                title={`${
                  isOwner ? 'Unassign yourself as' : 'Make yourself'
                } the owner of this task`}
                onClick={isOwner ? handleUnclaimTask : handleClaimTask}
              >
                {isOwner ? 'Disown task' : 'Claim task'}
              </button>
            )}
            <Link href={`/task/${task.number}/edit`}>
              <button
                className="pill-button"
                title={
                  isOwner
                    ? 'Edit task details'
                    : 'Only the task owner can edit this task'
                }
                disabled={!isOwner}
              >
                Edit task
              </button>
            </Link>
          </div>
        </div>

        <div id="task-info">
          <h4>Status</h4>
          <p>
            <span className="badge" title={`Status: ${task.status}`}>
              {task.status}
            </span>
          </p>

          <h4>Description</h4>
          <p>{task.description}</p>

          <h4>Owner</h4>
          <div className="owner-details">
            {task.owner && (
              <>
                <Avatar user={task.owner} />
                {task.owner.name}
              </>
            )}
          </div>

          <h4>Visibility</h4>
          <p>{task.visibility}</p>

          <h4>Created</h4>
          <p>
            <span>{new Date(task._creationTime).toDateString()}</span>
          </p>

          <h4>Comments</h4>
          {task && <Comments user={user} taskId={task._id} />}
        </div>
      </div>
    </main>
  )
}

export async function getServerSideProps({
  params,
}: {
  params: { taskNumber: number }
}) {
  // Capture the dynamic route segment [taskNumber] (trickier to do client side)
  const { taskNumber } = params
  return {
    props: { taskNumber: +taskNumber },
  }
}
