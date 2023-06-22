import { api } from './_generated/api'
import { query, mutation, action } from './_generated/server'
import {
  countResults,
  findByTask,
  findUser,
  type FileDocInfo,
} from './internal'
import type { File, NewFileInfo } from '../fullstack/types'
import type { Id } from './_generated/dataModel'

export type SafeFile = {
  name: string
  sha256: string
  storageId: string
  url: string
  size: number
}

export const getSafeFiles = query(async ({ db, storage }) => {
  const safeFiles = await db.query('safeFiles').collect()

  const files = (await Promise.all(
    safeFiles.map(async (f) => {
      const url = await storage.getUrl(f.storageId)
      if (!url)
        throw new Error('Error loading file URL; does the file still exist?')

      const metadata = await storage.getMetadata(f.storageId)
      if (!metadata)
        throw new Error(
          'Error loading file metadata; does the file still exist?'
        )
      const { size } = metadata

      return { ...f, url, size }
    })
  )) as SafeFile[]

  return files
})

export const upload = action(
  async (
    { runQuery, runMutation, storage },
    { taskId, fileInfo }: { taskId: string; fileInfo: NewFileInfo }
  ): Promise<File> => {
    // This function uploads a file to Convex's file storage,
    // and stores that file's info & associated task in the
    // 'files' table. This function assumes that the file's
    // integrity has already been verified client-side
    // and the file is safe to upload.
    const { author, name, type, data } = fileInfo

    // Re-create the file Blob from the data ArrayBuffer
    const blob = new Blob([data], { type })

    // Store the file to Convex and get the generated storageId
    const storageId = await storage.store(blob)

    // Save the file metadata, url & storageId to 'files' table
    const fileDocInfo = {
      storageId,
      taskId,
      userId: author.id,
      name,
      type,
    } as FileDocInfo

    const uploadedFileId = await runMutation(api.internal.saveFileDoc, {
      fileDocInfo,
    })

    const uploadedFile = await runQuery(api.internal.getFileById, {
      fileId: uploadedFileId,
    })
    if (!uploadedFile) throw new Error('Unexpected error retrieving saved file')

    return uploadedFile
  }
)

export const remove = mutation(
  async ({ db, auth, storage }, { fileId }: { fileId: string }) => {
    const id = db.normalizeId('files', fileId)
    if (id === null)
      throw new Error(`Could not delete file: Invalid fileId ${fileId}`)
    const fileDoc = await db.get(id)
    if (!fileDoc) throw new Error('Could not delete file: file not found')
    const { taskId, userId } = fileDoc

    const user = await findUser(db, auth)
    if (!user)
      throw new Error('Could not delete file: User is not authenticated')

    if (user._id !== userId)
      throw new Error(
        'Could not delete file: Current user does not match file author'
      )

    await storage.delete(fileDoc.storageId)
    await db.delete(id)

    // Update the denormalized file count for this task (for sorting)
    const fileCount = await countResults(findByTask(db, taskId, 'files'))
    await db.patch(taskId, { fileCount })
    return null
  }
)
