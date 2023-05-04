import { action } from '../_generated/server'
import fetch from 'node-fetch'
import { Id } from '../_generated/dataModel'
import type { File, NewFileInfo } from '../../types'

async function uploadFile(postUrl: string, file: NewFileInfo) {
  const result = await fetch(postUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file.data,
  })
  const { storageId } = (await result.json()) as { storageId: string }
  if (!storageId) throw new Error('Unexpected error saving file')
  return storageId
}

export default action(
  async (
    { runQuery, runMutation },
    { taskId, file }: { taskId: string; file: NewFileInfo }
  ): Promise<File> => {
    // This function uploads a file to Convex's file storage,
    // and stores that file's info & associated task in the
    // 'files' table. This function assumes that the file's
    // integrity has already been verified client-side
    // and the file is safe to upload.

    // Get a short-lived upload URL
    const postUrl = await runMutation('internal:getUploadUrl')

    // POST the file to the URL and get the generated storageId
    const storageId = await uploadFile(postUrl, file)

    // Save the file metadata, url & storageId to 'files' table
    const { name, type, author } = file

    const taskDocId = new Id('tasks', taskId)
    const userDocId = new Id('users', author.id)

    const newFileInfo = {
      storageId,
      taskId: taskDocId,
      userId: userDocId,
      name,
      type,
    }

    const uploadedFileId = await runMutation('internal:saveFileDoc', {
      taskId: taskDocId,
      fileInfo: newFileInfo,
    })

    const uploadedFile = await runQuery('internal:getFileById', {
      fileId: uploadedFileId,
    })
    if (!uploadedFile) throw new Error('Unexpected error retrieving saved file')

    return uploadedFile
  }
)
