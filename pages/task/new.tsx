import { FormEvent, useState } from 'react'
import { useMutation } from '../../convex/_generated/react'
import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/router'

export default function CreateTaskPage() {
  const { isAuthenticated } = useAuth0()
  if (!isAuthenticated)
    // This page should only be accessible to logged-in users
    // so we should never reach this, but just in case
    throw new Error('User must be logged in to create a task')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState('private')
  const createTask = useMutation('createTask')

  const router = useRouter()

  async function handleCreateTask(event: FormEvent) {
    event.preventDefault()
    const taskId = await createTask(title, visibility, description)
    router.push(`/task/${taskId}`)
  }

  return (
    <main className="py-4">
      <h1 className="text-center">Create New Task</h1>
      <div className="text-center">
        <form onSubmit={handleCreateTask}>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
          />
          <select
            name="visibility"
            onChange={(event) => setVisibility(event.target.value)}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
          <input type="submit" value="Save" disabled={!title} />
        </form>
      </div>
      <button onClick={() => router.back()}>Cancel</button>
    </main>
  )
}
