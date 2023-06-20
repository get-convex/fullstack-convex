import { api } from "./_generated/api";
import { action, internalMutation, internalQuery } from './_generated/server';
import { Id } from './_generated/dataModel'
import { findUser, findByTask, countResults, getFileFromDoc } from './internal'
import type { File, NewFileInfo } from '../fullstack/types'

type FileDocInfo = {
  name: string
  type: string
  taskId: Id<'tasks'>
  userId: Id<'users'>
  storageId: string
}

// Save a new file document with the given storage ID
export const saveFileDoc = internalMutation(
  async (mutCtx, { fileDocInfo }: { fileDocInfo: FileDocInfo }) => {
    const { db, auth } = mutCtx
    const user = await findUser(db, auth)
    if (!user) {
      throw new Error('Error saving file: User identity not found')
    }
    const { taskId, userId } = fileDocInfo
    if (!user._id.equals(userId)) {
      throw new Error('Error saving file: Invalid user identity')
    }

    const fileId = await db.insert('files', fileDocInfo)

    // Update the denormalized comment count in the tasks table
    // (used for indexing to support ordering by comment count)
    const fileCount = await countResults(findByTask(db, taskId, 'files'))

    await db.patch(taskId, { fileCount })
    return fileId
  }
)

// Retrieve a File object from a given
export const getFileById = internalQuery(
  async (
    queryCtx,
    { fileId }: { fileId: Id<'files'> }
  ): Promise<File | null> => {
    if (!(fileId instanceof Id<'files'>))
      throw new Error(`Invalid fileId ${fileId}`)
    const fileDoc = await queryCtx.db.get(fileId)
    if (!fileDoc) return null
    return await getFileFromDoc(queryCtx, fileDoc)
  }
)

export default action(
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
    const taskDocId = new Id('tasks', taskId)
    const userDocId = new Id('users', author.id)
    const fileDocInfo = {
      storageId,
      taskId: taskDocId,
      userId: userDocId,
      name,
      type,
    } as FileDocInfo

    const uploadedFileId = await runMutation(api.uploadFile.saveFileDoc, {
      fileDocInfo,
    })

    const uploadedFile = await runQuery(api.uploadFile.getFileById, {
      fileId: uploadedFileId,
    })
    if (!uploadedFile) throw new Error('Unexpected error retrieving saved file')

    return uploadedFile
  }
)
