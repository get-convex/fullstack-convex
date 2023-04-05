import React, { useState, useRef, useContext } from 'react'
import Modal from 'react-modal'
import Image from 'next/image'
import type { FormEvent, MouseEvent, KeyboardEvent, EventHandler } from 'react'
import { Task, File, User, BackendEnvironment, AppData } from '../types'
import { BackendContext, DataContext } from '../context'
import { CircledXIcon, DownloadIcon, UploadIcon } from './icons'
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

function FilePreviews({ files }: { files: File[] }) {
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
  files: File[]
  isOpen: boolean
  onDismiss: EventHandler<MouseEvent | KeyboardEvent>
  onUpload: (file: globalThis.File) => Promise<File>
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
            <div>
              <div>
                <p className="file-name">{f.name}</p>
                <p className="file-size">{showFileSize(f.size)}</p>
              </div>
              <button
                className="icon-button light"
                title={`Download ${f.name}`}
              >
                <DownloadIcon />
              </button>
            </div>
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
export function Files() {
  const backend = useContext(BackendContext) as BackendEnvironment
  const { fileHandler } = backend

  const data = useContext(DataContext) as AppData
  const { safeFiles, task, user } = data

  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  const fileInput = useRef<HTMLInputElement>(null) //TODO fix

  // TODO temporary fix for only displaying image files, although other files can be uploaded
  const imageFiles =
    task?.files?.filter((f) => f.type.startsWith('image')) || []
  const [visibleIndex, setVisibleIndex] = useState(5)
  const visibleFiles = imageFiles?.slice(0, visibleIndex) || []
  const moreFiles = imageFiles?.length - visibleFiles?.length

  if (!task) {
    return null // TODO loading
  }

  // const handleDeleteFile = async function (fileId: string) {
  //   await fileHandler.deleteFile(fileId)
  // }

  async function handleUploadFile(file: globalThis.File) {
    if (!task || !user)
      throw new Error(
        'Error uploading file: missing task or authenticated user'
      )
    const newFile = await fileHandler.uploadFile(task.id.toString(), file)
    setUploadModalOpen(false)
    return newFile
  }
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
          files={(safeFiles || []) as File[]}
          isOpen={uploadModalOpen}
          onDismiss={(e) => {
            e.preventDefault()
            setUploadModalOpen(false)
          }}
          onUpload={handleUploadFile}
        />
      </div>
      {visibleFiles && <FilePreviews files={visibleFiles} />}
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
