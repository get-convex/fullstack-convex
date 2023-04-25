import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react'
import Modal from 'react-modal'
import Image from 'next/image'
import type { FormEvent, MouseEvent, KeyboardEvent, EventHandler } from 'react'
import { File, BackendEnvironment, NewFileInfo, Task, User } from '../types'
import { BackendContext } from '../fullstack/backend'
import { CircledXIcon, DownloadIcon, UploadIcon } from './icons'
import Link from 'next/link'
import { PaperClipIcon } from './icons'
import { showTimeAgo } from './comments'

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
  onDelete,
}: {
  files: File[]
  onDelete: (fileId: string) => Promise<null>
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  return (
    <>
      <div className="flex-col">
        <div id="file-previews">
          {files.map((f, i) => (
            <div
              key={i}
              className="file-preview"
              onClick={() => setSelectedFile(f)}
            >
              <Image src={f.url} alt={f.name} fill sizes="40vw" />
            </div>
          ))}
        </div>
      </div>
      <FileDetailModal
        file={selectedFile}
        isOpen={!!selectedFile}
        onDismiss={() => setSelectedFile(null)}
        onDelete={async () => {
          if (selectedFile) {
            await onDelete(selectedFile.id)
            setSelectedFile(null)
          }
          return null
        }}
      />
    </>
  )
}

function FileDetailModal({
  file,
  isOpen,
  onDismiss,
  onDelete,
}: {
  file: File | null
  isOpen: boolean
  onDismiss: EventHandler<MouseEvent | KeyboardEvent>
  onDelete: (fileId: string) => Promise<null>
}) {
  Modal.setAppElement('#app')

  const [imageLoading, setImageLoading] = useState(true)
  const [imageSize, setImageSize] = useState([0, 0])
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!file) return null

  const handleDelete = async () => {
    if (!confirmDelete) return
    setConfirmDelete(false)
    await onDelete(file.id)
  }

  return (
    <Modal
      id="file-detail-modal"
      isOpen={isOpen}
      onRequestClose={onDismiss}
      className="modal-content file-modal"
      overlayClassName="modal-overlay"
    >
      <div className="file-modal-header">
        <button className="close-button icon-button" onClick={onDismiss}>
          <CircledXIcon />
        </button>
        <h2>
          <PaperClipIcon /> {file.name}
        </h2>
      </div>
      <div id="file-detail-preview">
        {imageLoading && 'Loading...'}
        <Image
          src={file.url}
          alt={file.name}
          width={imageSize[0]}
          height={imageSize[1]}
          unoptimized
          onLoadingComplete={(e) => {
            setImageSize([e.naturalWidth, e.naturalHeight])
            setImageLoading(false)
          }}
        />
      </div>
      <div className="file-modal-footer">
        <div>
          <p className="file-size">
            {`Uploaded ${showTimeAgo(new Date(file.creationTime))} by ${
              file.author.name
            }`}
          </p>
        </div>
        <div>
          <p className="file-size">{showFileSize(file.size)}</p>
          <Link
            href={file.url}
            target="_blank"
            style={{ textDecoration: 'none' }}
          >
            <button className="dark" title={`Download ${file.name}`}>
              Download
            </button>
          </Link>
          <button
            className="dark"
            style={
              { backgroundColor: 'red' } //TODO
            }
            onClick={() =>
              confirmDelete ? handleDelete() : setConfirmDelete(true)
            }
          >
            {confirmDelete ? `Really delete ${file.name}?` : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function FileUploadModal({
  previews,
  isOpen,
  onDismiss,
  onUpload,
}: {
  previews: File[]
  isOpen: boolean
  onDismiss: EventHandler<MouseEvent | KeyboardEvent>
  onUpload: (file: globalThis.File) => Promise<File>
}) {
  Modal.setAppElement('#app')

  const [error, setError] = useState('')
  const [fileToUpload, setFileToUpload] = useState<globalThis.File | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function uploadFile() {
      if (!fileToUpload) return
      try {
        await onUpload(fileToUpload)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setFileToUpload(null)
      }
    }
    uploadFile()
  }, [fileToUpload, onUpload])

  const onChooseFile = useCallback(async function (event: FormEvent) {
    event.preventDefault()
    try {
      const { files } = event.target as HTMLInputElement

      // we should never end up here, but just in case
      if (!files || files.length !== 1)
        throw new Error('Incorrect number of files selected')

      const inputFile = files[0]
      // we should never end up here, but just in case
      if (!inputFile) throw new Error('No file selected for upload')

      if (fileInput.current) {
        fileInput.current.value = ''
      }
      setFileToUpload(inputFile)
      setError('')
    } catch (e: unknown) {
      console.error(e)
      setFileToUpload(null)
      const error = e as Error
      setError(error.message)
    }
  }, [])

  //TODO Keyboard handlers

  const onClose = useCallback(
    function onClose(e: MouseEvent | KeyboardEvent) {
      setFileToUpload(null)
      onDismiss(e)
    },
    [onDismiss]
  )

  return (
    <Modal
      id="file-upload-modal"
      isOpen={isOpen}
      onRequestClose={onClose}
      className="modal-content file-modal"
      overlayClassName="modal-overlay"
    >
      <div className="file-modal-header">
        <button className="close-button icon-button" onClick={onClose}>
          <CircledXIcon />
        </button>
        <h2>Upload files</h2>
        <p>You can only upload these predefined files for safety reasons</p>
      </div>
      <div id="safe-files">
        {previews.map((f, i) => (
          <div key={i} className="file-detail">
            <div className="file-preview">
              <Image src={f.url} alt={f.name} fill sizes="40vw" />
            </div>
            <div>
              <div>
                <p className="file-name">{f.name}</p>
                <p className="file-size">{showFileSize(f.size)}</p>
              </div>
              <Link href={f.url} target="_blank">
                <button
                  className="icon-button light"
                  title={`Download ${f.name}`}
                >
                  <DownloadIcon />
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
      <form
        id="file-upload-form"
        className="file-modal-footer"
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
          <label>
            {error || (fileToUpload && `Uploading ${fileToUpload.name}...`)}
          </label>
          <input
            id="upload"
            type="file"
            tabIndex={-1}
            onChange={onChooseFile}
            ref={fileInput}
          />
        </div>
        <div>
          <button className="light" onClick={onClose}>
            Cancel
          </button>
          <button className="dark" disabled={!!fileToUpload}>
            <label htmlFor="upload">Upload...</label>
          </button>
        </div>
      </form>
    </Modal>
  )
}
export function Files({
  user,
  task,
  safeFiles,
}: {
  user?: User | null
  task: Task
  safeFiles: File[]
}) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  const {
    fileManagement: { saveFile, deleteFile },
  } = useContext(BackendContext) as BackendEnvironment

  const { id: taskId, files } = task
  const safeSHAs = useMemo(() => safeFiles.map((sf) => sf.sha256), [safeFiles])

  const [visibleIndex, setVisibleIndex] = useState(5)

  const visibleFiles = files?.slice(0, visibleIndex) || []
  const moreFiles = files?.length - visibleFiles?.length

  const checkFileIntegrity = useCallback(
    async (fileBuffer: ArrayBuffer) => {
      if (!safeSHAs) return false

      // Check this file's hash to make sure it's one of the
      // pre-approved safe files to prevent abuse
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const fileSHA = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('') // convert bytes to hex string

      return safeSHAs.includes(fileSHA)
    },
    [safeSHAs]
  )

  const getFileInfo = useCallback(
    async (inputFile: globalThis.File) => {
      const { name, type, size } = inputFile
      const fileBuffer = await inputFile.arrayBuffer()
      const isSafeFile = await checkFileIntegrity(fileBuffer)
      if (!isSafeFile)
        throw new Error(
          'Unsafe file: Only pre-approved files can be uploaded to prevent abuse'
        )

      const newFile = {
        author: user,
        name,
        type,
        size,
        data: fileBuffer,
      } as NewFileInfo
      return newFile
    },
    [user, checkFileIntegrity]
  )

  const closeModal = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      setUploadModalOpen(false)
    },
    [setUploadModalOpen]
  )

  const handleUploadFile = useCallback(
    async (inputFile: globalThis.File) => {
      if (!task || !user)
        throw new Error(
          'Error uploading file: missing task or authenticated user'
        )

      try {
        const validFileInfo = await getFileInfo(inputFile)
        const newFile = await saveFile(taskId, validFileInfo)
        setUploadModalOpen(false)
        return newFile
      } catch (e) {
        throw e as Error
      }
    },
    [saveFile, taskId, getFileInfo, task, user]
  )

  const handleDeleteFile = useCallback(
    async function (fileId: string) {
      if (!task || !user) {
        throw new Error(
          'Error deleting file: missing task or authenticated user'
        )
      }
      try {
        return await deleteFile(fileId)
      } catch (e) {
        throw e as Error
      }
    },
    [deleteFile, task, user]
  )

  return (
    <div id="files">
      <div id="files-header">
        <h4>Files ({files?.length || 0})</h4>
        <button
          id="file-upload"
          className="light"
          onClick={() => setUploadModalOpen(true)}
        >
          <UploadIcon /> Upload
        </button>
        <FileUploadModal
          previews={safeFiles}
          isOpen={uploadModalOpen}
          onDismiss={closeModal}
          onUpload={handleUploadFile}
        />
      </div>
      {visibleFiles && (
        <FilePreviews files={visibleFiles} onDelete={handleDeleteFile} />
      )}
      {moreFiles > 0 && (
        <div id="more-files">
          <button
            className="more-button"
            onClick={() => setVisibleIndex(files.length)}
          >
            + {moreFiles} more
          </button>
        </div>
      )}
    </div>
  )
}
