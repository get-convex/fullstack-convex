import React from 'react'
import { useQuery } from '../../../convex/_generated/react'
import { HeaderWithLogin } from '../../../components/login'
import { TaskDetails } from '../../../components/taskDetails'

export default function TaskDetailPage({ taskNumber }: { taskNumber: number }) {
  const user = useQuery('getCurrentUser')
  const task = useQuery('getTask', taskNumber)

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
