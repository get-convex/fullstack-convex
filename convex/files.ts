import { internal } from './_generated/api'
import {
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
} from './_generated/server'
import { countResults, findByTask, findUser, getFileFromDoc } from './util'
import { v } from 'convex/values'
import { vUser, type tTaskId, type tUserId } from './validators'
import type { File } from '../fullstack/types'

export type SafeFile = {
  name: string
  sha256: string
  storageId: string
  url: string
  size: number
}

export const getSafeFiles = query({
  handler: async (ctx) => {
    const safeFiles = await ctx.db.query('safeFiles').collect()

    const files = (await Promise.all(
      safeFiles.map(async (f) => {
        const url = await ctx.storage.getUrl(f.storageId)
        if (!url)
          throw new Error('Error loading file URL; does the file still exist?')

        const metadata = await ctx.storage.getMetadata(f.storageId)
        if (!metadata)
          throw new Error(
            'Error loading file metadata; does the file still exist?'
          )
        const { size } = metadata

        return { ...f, url, size }
      })
    )) as SafeFile[]

    return files
  },
})

export const upload = action({
  args: {
    taskId: v.string(),
    fileInfo: v.object({
      author: vUser,
      name: v.string(),
      type: v.string(),
      data: v.bytes(),
      size: v.number(),
    }),
  },
  handler: async (ctx, { taskId, fileInfo }): Promise<File> => {
    // This function uploads a file to Convex's file storage,
    // and stores that file's info & associated task in the
    // 'files' table. This function assumes that the file's
    // integrity has already been verified client-side
    // and the file is safe to upload.
    const { author, name, type, data } = fileInfo

    // Re-create the file Blob from the data ArrayBuffer
    const blob = new Blob([data], { type })

    // Store the file to Convex and get the generated storageId
    const storageId = await ctx.storage.store(blob)

    // Save the file metadata, url & storageId to 'files' table
    const fileDocInfo = {
      storageId,
      taskId: taskId as tTaskId,
      userId: author.id as tUserId,
      name,
      type,
    }

    const uploadedFileId = await ctx.runMutation(internal.files.saveFileDoc, {
      fileDocInfo,
    })

    const uploadedFile = await ctx.runQuery(internal.files.getFileById, {
      fileId: uploadedFileId,
    })
    if (!uploadedFile) throw new Error('Unexpected error retrieving saved file')

    return uploadedFile
  },
})

export const remove = mutation({
  args: { fileId: v.string() },
  handler: async (ctx, { fileId }) => {
    const id = ctx.db.normalizeId('files', fileId)
    if (id === null)
      throw new Error(`Could not delete file: Invalid fileId ${fileId}`)
    const fileDoc = await ctx.db.get(id)
    if (!fileDoc) throw new Error('Could not delete file: file not found')
    const { taskId, userId } = fileDoc

    const user = await findUser(ctx.db, ctx.auth)
    if (!user)
      throw new Error('Could not delete file: User is not authenticated')

    if (user._id !== userId)
      throw new Error(
        'Could not delete file: Current user does not match file author'
      )

    await ctx.storage.delete(fileDoc.storageId)
    await ctx.db.delete(id)

    // Update the denormalized file count for this task (for sorting)
    const fileCount = await countResults(findByTask(ctx.db, taskId, 'files'))
    await ctx.db.patch(taskId, { fileCount })
    return null
  },
})

// Save a new file document with the given storage ID
export const saveFileDoc = internalMutation({
  args: {
    fileDocInfo: v.object({
      name: v.string(),
      type: v.string(),
      taskId: v.id('tasks'),
      userId: v.id('users'),
      storageId: v.string(),
    }),
  },
  handler: async (mutCtx, { fileDocInfo }) => {
    const { db, auth } = mutCtx
    const user = await findUser(db, auth)
    if (!user) {
      throw new Error('Error saving file: User identity not found')
    }
    const { taskId, userId } = fileDocInfo
    if (user._id !== userId) {
      throw new Error('Error saving file: Invalid user identity')
    }

    const fileId = await db.insert('files', fileDocInfo)

    // Update the denormalized comment count in the tasks table
    // (used for indexing to support ordering by comment count)
    const fileCount = await countResults(findByTask(db, taskId, 'files'))

    await db.patch(taskId, { fileCount })
    return fileId
  },
})

// Retrieve a File object from a given
export const getFileById = internalQuery({
  args: { fileId: v.id('files') },
  handler: async (queryCtx, { fileId }): Promise<File | null> => {
    if (queryCtx.db.normalizeId('files', fileId) === null)
      throw new Error(`Invalid fileId ${fileId}`)
    const fileDoc = await queryCtx.db.get(fileId)
    if (!fileDoc) return null
    return await getFileFromDoc(queryCtx, fileDoc)
  },
})
