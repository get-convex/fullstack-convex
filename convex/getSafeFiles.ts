import { query } from './_generated/server'

export type SafeFile = {
  name: string
  sha256: string
  storageId: string
  url: string
  size: number
}

export default query(async ({ db, storage }) => {
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

export const getSafeSHAs = query(async ({ db }) => {
  const safeFiles = await db.query('safeFiles').collect()
  return safeFiles.map((f) => f.sha256)
})
