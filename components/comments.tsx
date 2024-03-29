import React, { useCallback, useContext, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Avatar } from './login'
import { ArrowUpIcon } from './icons'
import { BackendEnvironment, Comment, Task, User } from '../fullstack/types'
import { BackendContext } from '../fullstack/backend'
import { showTimeAgo } from './helpers'

function CommentListing({ comment }: { comment: Comment }) {
  const { body, author, creationTime } = comment
  const created = new Date(creationTime)
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
          <button className="more-button" onClick={() => setVisibleIndex(0)}>
            <ArrowUpIcon />
            {moreComments} more comment{moreComments === 1 ? '' : 's'}
          </button>
        </div>
      )}
      {visibleComments.map((c) => (
        <CommentListing key={c.id.toString()} comment={c} />
      ))}
    </div>
  )
}

export function Comments({ user, task }: { user?: User | null; task: Task }) {
  const backend = useContext(BackendContext) as BackendEnvironment
  const { saveComment } = backend.taskManagement
  const [newComment, setNewComment] = useState('')
  const [savingText, setSavingText] = useState('')
  const body = newComment.trim()

  const submitComment = useCallback(
    async function (event: FormEvent) {
      event.preventDefault()
      setSavingText(body)
      setNewComment('')
      await saveComment({ taskId: task.id, body })
      setSavingText('')
    },
    [saveComment, task, body]
  )

  const handleKeyUp = useCallback(
    function (event: KeyboardEvent) {
      if (!body) return
      if (event.key === 'Enter' && !event.shiftKey) {
        submitComment(event)
      }
    },
    [submitComment, body]
  )

  return (
    <div id="comments">
      {task.comments && <CommentList comments={task.comments} />}
      {user && (
        <>
          {savingText && (
            <CommentListing
              key="new"
              comment={
                {
                  body: savingText,
                  author: user,
                  creationTime: Date.now(),
                } as Comment
              }
            />
          )}
          <form id="new-comment" onSubmit={submitComment}>
            <Avatar user={user} size={30} />
            <textarea
              id="new-comment-text"
              rows={4}
              value={newComment}
              onKeyUp={handleKeyUp}
              onChange={(event) =>
                setNewComment(event.target.value.trimStart())
              }
              placeholder="Post a comment…"
              title={
                !newComment || body
                  ? 'Enter to submit, Shift+Enter for newline'
                  : 'Comment cannot be empty'
              }
              required
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
