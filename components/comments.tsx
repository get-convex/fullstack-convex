import React, { useState } from 'react'
import { useQuery, useMutation } from '../convex/_generated/react'
import type { FormEvent } from 'react'
import { Avatar } from './login'
import type { Document, Id } from '../convex/_generated/dataModel'
import type { Comment } from '../convex/listComments'

export function showTimeAgo(created: Date) {
  const now = Date.now()
  const secondsAgo = Math.round((now - created.valueOf()) / 1000)
  if (secondsAgo < 60) {
    return `${secondsAgo}s`
  }
  const minutesAgo = Math.round(secondsAgo / 60)
  if (minutesAgo < 60) {
    return `${minutesAgo}m`
  }
  const hoursAgo = Math.round(minutesAgo / 60)
  if (hoursAgo < 24) {
    return `${hoursAgo}h`
  }
  const daysAgo = Math.round(hoursAgo / 24)
  return `${daysAgo}d`
}

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
            <span
              title={created.toLocaleString()}
              style={{ minWidth: '3ch', textAlign: 'right' }}
            >
              {showTimeAgo(created)}
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
  user?: Document<'users'> | null
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
            value="Add comment"
            title={invalid ? 'Comment cannot be empty' : 'Add comment'}
            disabled={invalid}
          />
        </form>
      )}
    </div>
  )
}

export function CommentsGhost() {
  return (
    <div>
      <form style={{ margin: '8px 16px' }}>
        <input
          className="ghost"
          style={{ flexGrow: 2 }}
          placeholder="Write a comment…"
        />
        <input type="submit" className="ghost" value="Add comment" disabled />
      </form>
    </div>
  )
}
