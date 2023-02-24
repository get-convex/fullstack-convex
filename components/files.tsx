import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { useQuery, useMutation } from '../convex/_generated/react'
import { Avatar } from './login'
import { FileAttachment } from '../convex/listFiles'
import { showTimeAgo } from './comments'
import type { FormEvent, MouseEventHandler } from 'react'
import { Id, type Document } from '../convex/_generated/dataModel'

function showFileSize(size: number) {
  if (size < 1024) return `${Math.round(size)} B`
  const kb = size / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${Math.round(mb)} MB`
  const gb = kb / 1024
  return `${Math.round(gb)} GB`
}

function showFileType(type: string) {
  switch (type.split('/')[0]) {
    case 'image':
      return '🖼️'
    case 'video':
      return '📼'
    case 'text':
      return '📄'
    default:
      return '📎'
  }
}

function FileList({
  files,
  user,
}: {
  files: FileAttachment[]
  user?: Document<'users'> | null
}) {
  const deleteFile = useMutation('deleteFile')
  const handleDeleteFile = async function (fileId: Id<'files'>) {
    await deleteFile(fileId)
  }

  return (
    <ul className="files">
      {files.map(({ _id, _creationTime, name, type, author, url, size }) => {
        const created = new Date(_creationTime)
        const isFileAuthor = user && user._id.equals(author._id)

        return (
          <li key={_id.toString()} className="file">
            <div
              style={{
                width: '90%',
                marginRight: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                overflowWrap: 'anywhere',
              }}
            >
              <div style={{ flexGrow: 2, marginRight: '16px' }}>
                <span>{showFileType(type)}</span>
                <Link href={url} target="_blank">
                  {name}
                </Link>
                <span> ({showFileSize(size)})</span>
              </div>
              <div style={{ flexShrink: 0 }}>
                {isFileAuthor && (
                  <button
                    className="icon-button"
                    title="Delete file"
                    onClick={() => handleDeleteFile(_id)}
                  >
                    🗑️
                  </button>
                )}
                {/* <button className="icon-button" title="Download file">
                  ⬇️
                </button> */}
              </div>
            </div>
            <span>
              <Avatar user={author} size={20} />
            </span>
            <span title={created.toLocaleString()}>{showTimeAgo(created)}</span>
          </li>
        )
      })}
    </ul>
  )
}

export function Files({
  user,
  taskId,
}: {
  user?: Document<'users'> | null
  taskId: Id<'tasks'>
}) {
  const files = useQuery('listFiles', taskId)
  const generateUploadUrl = useMutation('saveFile:generateUploadUrl')
  const saveFile = useMutation('saveFile')

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  async function handleSelectFile(event: FormEvent) {
    const { files } = event.target as HTMLInputElement
    console.log(files)
    if (files && files.length) setSelectedFile(files[0])
  }

  async function handleUploadFile(event: FormEvent) {
    event.preventDefault()
    const newFile = selectedFile
    setSelectedFile(null)
    if (fileInput.current) fileInput.current.value = ''

    // we should never end up here, but just in case
    if (!newFile) throw new Error('No file selected for upload')

    const { name, type } = newFile

    // Step 1: Get a short-lived upload URL
    const postUrl = await generateUploadUrl()
    // Step 2: POST the file to the URL
    const result = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': newFile.type },
      body: newFile,
    })
    const { storageId } = await result.json()

    await saveFile(taskId, storageId, name, type)
  }

  return (
    <div>
      {files && <FileList files={files} user={user} />}
      {user && (
        <form style={{ margin: '8px 16px' }} onSubmit={handleUploadFile}>
          <label
            htmlFor="upload"
            className="pill-button"
            style={{ height: '1.5em' }}
          >
            Browse files
          </label>
          <input
            id="upload"
            type="file"
            style={{ opacity: 0 }}
            onChange={handleUploadFile}
            ref={fileInput}
          />

          <input
            type="submit"
            value="Upload file"
            title={
              !selectedFile ? 'Choose a file first' : 'Upload the selected file'
            }
            disabled={!selectedFile}
          />
        </form>
      )}
    </div>
  )
}
