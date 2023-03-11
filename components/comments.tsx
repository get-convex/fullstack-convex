import React, { useState } from 'react'
import { useMutation } from '../convex/_generated/react'
import type { FormEvent } from 'react'
import { Avatar } from './login'
import { ArrowUp } from './icons'
import type { Document } from '../convex/_generated/dataModel'
import type { Task, Comment } from '../convex/getTask'

export function showTimeAgo(created: Date) {
  const now = Date.now()
  const secondsAgo = Math.round((now - created.valueOf()) / 1000)
  if (secondsAgo === 0) return 'now'
  if (secondsAgo < 60) {
    return `${secondsAgo} second${secondsAgo === 1 ? '' : 's'} ago`
  }
  const minutesAgo = Math.round(secondsAgo / 60)
  if (minutesAgo < 60) {
    return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`
  }
  const hoursAgo = Math.round(minutesAgo / 60)
  if (hoursAgo < 24) {
    return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`
  }
  const daysAgo = Math.round(hoursAgo / 24)
  return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`
}

function CommentListing({ comment }: { comment: Comment }) {
  const { body, author, _creationTime } = comment
  const created = new Date(_creationTime)
  return (
    <div className="comment-listing">
      <Avatar user={author} size={30} />
      <div className="comment-info">
        <div>
          <span>{author.name.split(' ')[0]}</span>
          <span title={created.toLocaleString()}>{showTimeAgo(created)}</span>
        </div>
        <p>{body}</p>
      </div>
    </div>
  )
}

function CommentList({ comments }: { comments: Comment[] }) {
  const [visibleIndex, setVisibleIndex] = useState(comments.length - 2)
  const visibleComments = comments.slice(visibleIndex)

  const moreComments = comments.length - visibleComments.length
  return (
    <div id="comment-list">
      {moreComments > 0 && (
        <div id="more-comments">
          <button onClick={() => setVisibleIndex(0)}>
            <ArrowUp />
            {moreComments} more comment{moreComments === 1 ? '' : 's'}
          </button>
        </div>
      )}
      {visibleComments.map((c) => (
        <CommentListing key={c._id.toString()} comment={c} />
      ))}
    </div>
  )
}

export function Comments({
  user,
  task,
}: {
  user?: Document<'users'> | null
  task: Task
}) {
  const saveComment = useMutation('saveComment')
  const [newComment, setNewComment] = useState('')
  const [savingText, setSavingText] = useState('')

  async function handleAddComment(event: FormEvent) {
    event.preventDefault()
    setSavingText(newComment)
    setNewComment('')
    await saveComment(task._id, newComment.trim())
    setSavingText('')
  }

  return (
    <div id="task-comments">
      {task.commentList && <CommentList comments={task.commentList} />}
      {user && (
        <>
          {savingText && (
            <CommentListing
              key="new"
              comment={
                {
                  body: savingText,
                  author: user,
                  _creationTime: Date.now(),
                } as Comment
              }
            />
          )}
          <form id="new-comment" onSubmit={handleAddComment}>
            <Avatar user={user} size={30} />
            {/* <textarea
            rows={4}
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            placeholder="Post a comment…"
            required={true}
            
          /> */}
            <input
              id="new-comment-text"
              type="text"
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              required
              placeholder="Post a comment..."
            />
          </form>
        </>
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
