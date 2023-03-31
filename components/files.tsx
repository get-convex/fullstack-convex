import React, { useState, useRef } from 'react'
import Modal from 'react-modal'
import NextError from 'next/error'
import { useQuery, useMutation } from '../convex/_generated/react' //TODO refactor
import { CircledXIcon, UploadIcon } from './icons'
import Image from 'next/image'
import { Id, type Document } from '../convex/_generated/dataModel'
import type { FormEvent, MouseEvent, KeyboardEvent, EventHandler } from 'react'
import type { Task, File } from '../convex/getTask'
import type { SafeFile } from '../convex/getSafeFiles'

function showFileSize(size: number) {
  if (size < 1024) return `${Math.round(size)} B`
  const kb = size / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${Math.round(mb)} MB`
  const gb = kb / 1024
  return `${Math.round(gb)} GB`
}

function FilePreviews({
  files,
}: {
  files: File[]
  user?: Document<'users'> | null
}) {
  return (
    <div className="flex-col">
      <div id="file-previews">
        {files.map((f, i) => (
          <div key={i} className="file-preview">
            <Image src={f.url} alt={f.name} fill />
          </div>
        ))}
      </div>
    </div>
  )
}

function FileUploadModal({
  files,
  isOpen,
  onDismiss,
  onUpload,
}: {
  files: SafeFile[]
  isOpen: boolean
  onDismiss: EventHandler<MouseEvent | KeyboardEvent>
  onUpload: (file: globalThis.File) => Promise<void>
}) {
  Modal.setAppElement('#app')

  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  function validateFileInput(event: FormEvent) {
    const { files } = event.target as HTMLInputElement

    // we should never end up here, but just in case
    if (!files || files.length !== 1)
      throw new Error('Incorrect number of files selected')

    const newFile = files[0]
    if (fileInput.current) fileInput.current.value = ''

    // we should never end up here, but just in case
    if (!newFile) throw new Error('No file selected for upload')

    return newFile
  }

  async function handleUploadFile(event: FormEvent) {
    event.preventDefault()
    const newFile = validateFileInput(event)
    if (!newFile) return null

    setSelectedFile(newFile)
    try {
      await onUpload(newFile)
    } catch (error: any) {
      setError(error && error.message)
    }
    setSelectedFile(null)
  }

  //TODO Keyboard handlers

  function onClose(e: MouseEvent | KeyboardEvent) {
    setSelectedFile(null)
    onDismiss(e)
  }

  return (
    <Modal
      id="file-upload-modal"
      isOpen={isOpen}
      onRequestClose={onClose}
      className="modal-content"
      overlayClassName="modal-overlay"
    >
      <div id="file-upload-header">
        <button className="close-button icon-button" onClick={onClose}>
          <CircledXIcon />
        </button>
        <h2>Upload files</h2>
        <p>You can only upload these predefined files for safety reasons</p>
      </div>
      <div id="safe-files">
        {files.map((f, i) => (
          <div key={i} className="safe-file">
            <div className="file-preview">
              <Image src={f.url} alt={f.name} fill />
            </div>
            <p className="file-name">{f.name}</p>
            <p className="file-size">{showFileSize(f.size)}</p>
            {/* TODO download button */}
          </div>
        ))}
      </div>
      <form id="file-upload-form" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label>
            {error || (selectedFile && `Uploading ${selectedFile.name}...`)}
          </label>
          <input
            id="upload"
            type="file"
            tabIndex={-1}
            onChange={handleUploadFile}
            ref={fileInput}
          />
        </div>
        <div>
          <button className="light" onClick={onClose}>
            Cancel
          </button>
          <button className="dark">
            <label htmlFor="upload">Upload</label>
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function Files({
  user,
  task,
}: {
  user?: Document<'users'> | null
  task: Task
}) {
  const generateUploadUrl = useMutation('saveFile:generateUploadUrl')
  const saveFile = useMutation('saveFile')

  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  // TODO delete files?
  const deleteFile = useMutation('deleteFile')
  const handleDeleteFile = async function (fileId: Id<'files'>) {
    await deleteFile(fileId)
  }

  const safeFiles = useQuery('getSafeFiles')

  async function getSHA(file: globalThis.File) {
    // Compute SHA-256 hash ArrayBuffer
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      await file.arrayBuffer()
    )

    // Convert buffer to hex string
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    return hashHex
  }

  async function uploadFile(file: globalThis.File) {
    if (!safeFiles) throw new Error('Safe files not loaded')
    const safeSHAs = safeFiles?.map((f) => f.sha256)

    // Step 0: Verify that this is one of the known safe files (to prevent abuse)
    const sha = await getSHA(file)
    console.log(sha, typeof sha)
    console.log(safeSHAs, typeof safeSHAs[0])
    if (!safeSHAs.includes(sha))
      throw new Error('Unsafe file: Only predefined assets can be uploaded')

    // Step 1: Get a short-lived upload URL
    const postUrl = await generateUploadUrl()

    // Step 2: POST the file to the URL
    const result = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    const { storageId } = await result.json()

    await saveFile(task._id, storageId, file.name, file.type)
    setUploadModalOpen(false)
  }

  // TODO temporary fix for only displaying image files, although other files can be uploaded
  const imageFiles = task?.files?.filter((f) => f.type.startsWith('image'))
  const [visibleIndex, setVisibleIndex] = useState(5)
  const visibleFiles = imageFiles?.slice(0, visibleIndex)
  const moreFiles = imageFiles?.length - visibleFiles?.length

  if (!task) return null
  if (!safeFiles)
    return (
      <NextError
        statusCode={500}
        title="Safe files not found; please report to the team"
        withDarkMode={false}
      />
    )

  return (
    <div id="files">
      <div id="files-header">
        <h4>Files ({imageFiles?.length || 0})</h4>
        <button
          id="file-upload"
          className="light"
          onClick={() => setUploadModalOpen(true)}
        >
          <UploadIcon /> Upload
        </button>
        <FileUploadModal
          files={safeFiles}
          isOpen={uploadModalOpen}
          onDismiss={(e) => {
            e.preventDefault()
            setUploadModalOpen(false)
          }}
          onUpload={uploadFile}
        />
      </div>
      {visibleFiles && <FilePreviews files={visibleFiles} user={user} />}
      {moreFiles > 0 && (
        <div id="more-files">
          <button
            className="more-button"
            onClick={() => setVisibleIndex(task.files.length)}
          >
            + {moreFiles} more
          </button>
        </div>
      )}
    </div>
  )
}
