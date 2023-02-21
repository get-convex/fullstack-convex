import React from 'react'
import { useQuery } from '../../../convex/_generated/react'
import { HeaderWithLogin } from '../../../components/login'
import { TaskDetails } from '../../../components/taskDetails'

export default function TaskDetailPage({ taskNumber }: { taskNumber: number }) {
  const user = useQuery('getCurrentUser')
  const task = useQuery('getTask', taskNumber)

  if (!task) {
    return (
      <main>
        <h1>Task not found</h1>
      </main>
    )
  }

  return (
    <main>
      <HeaderWithLogin user={user} />
      <TaskDetails task={task} user={user} />
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
