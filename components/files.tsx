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
import { File, BackendEnvironment, AppData, NewFileInfo, Task } from '../types'
import { BackendContext } from '../fullstack/backend'
import { DataContext } from '../fullstack/data'
import { CircledXIcon, DownloadIcon, UploadIcon } from './icons'
import { useQuery } from '../convex/_generated/react'

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
        {previews.map((f, i) => (
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
  const {
    taskManagement: { saveFile },
  } = backend

  const { safeFiles, task, user } = useContext(DataContext) as AppData
  const { id: taskId, files } = useMemo(() => task.value as Task, [task.value])
  const safeSHAs = useQuery('getSafeFiles:getSafeSHAs') //TODO fix this

  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  // TODO temporary fix for only displaying image files, although other files can be uploaded
  const imageFiles = useMemo(
    () => files?.filter((f) => f.type.startsWith('image')) || [],
    [files]
  )
  const [visibleIndex, setVisibleIndex] = useState(5)
  const visibleFiles = imageFiles?.slice(0, visibleIndex) || []
  const moreFiles = imageFiles?.length - visibleFiles?.length

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
        author: user.value,
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
      if (!task.value || !user.value)
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
    [saveFile, taskId, getFileInfo, task.value, user.value]
  )

  // const handleDeleteFile = async function (fileId: string) {
  //   await fileHandler.deleteFile(fileId)
  // }

  if (task.isLoading || safeFiles.isLoading) {
    return null // TODO loading
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
          previews={(safeFiles.value || []) as File[]}
          isOpen={uploadModalOpen}
          onDismiss={closeModal}
          onUpload={handleUploadFile}
        />
      </div>
      {visibleFiles && <FilePreviews files={visibleFiles} />}
      {moreFiles > 0 && (
        <div id="more-files">
          <button
            className="more-button"
            onClick={() => setVisibleIndex(imageFiles.length)}
          >
            + {moreFiles} more
          </button>
        </div>
      )}
    </div>
  )
}
