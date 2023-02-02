import { useState } from 'react'
import { useQuery, useMutation } from '../convex/_generated/react'
import type { FormEvent } from 'react'
import { Avatar } from './login'
import type { Document, Id } from '../convex/_generated/dataModel'
import type { Comment } from '../convex/listComments'

function CommentList({ comments }: { comments: Comment[] }) {
  return (
    <ul>
      {comments.map(({ _id, body, author, _creationTime }) => {
        const created = new Date(_creationTime)
        return (
          <li key={_id.toString()}>
            <span>{body}</span>
            <span>
              <Avatar user={author} size={20} />
            </span>
            <span title={created.toLocaleString()}>
              {created.toLocaleTimeString('en-UK')}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function Comments({
  user,
  taskId,
}: {
  user: Document<'users'> | null | undefined
  taskId: Id<'tasks'>
}) {
  const comments = useQuery('listComments', taskId)
  const saveComment = useMutation('saveComment')
  const [newComment, setNewComment] = useState('')

  async function handleAddComment(event: FormEvent) {
    event.preventDefault()
    setNewComment('')
    await saveComment(taskId, newComment.trim())
  }

  const invalid = !newComment.trim()

  return (
    <div>
      {comments && <CommentList comments={comments} />}
      {user && (
        <form style={{ margin: '8px 16px' }} onSubmit={handleAddComment}>
          <input
            style={{ flexGrow: 2 }}
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            placeholder="Write a comment…"
          />
          <input
            type="submit"
            className="pill-button"
            value="Add comment"
            title={invalid ? 'Comment cannot be empty' : 'Add comment'}
            disabled={invalid}
          />
        </form>
      )}
    </div>
  )
}
