import fs from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import db, { startIndexInfo, finishIndexInfo } from './db'

const BATCH_SIZE = 5000

export function getDrives() {
  const drives = []
  for (let code = 65; code <= 90; code++) {
    const drive = `${String.fromCharCode(code)}:\\`
    if (existsSync(drive)) drives.push(drive)
  }
  return drives
}

const insert = db.prepare(`
  INSERT OR IGNORE INTO files (id, name, path, is_directory, size, modified_at)
  VALUES (?, ?, ?, ?, ?, ?)
`)
const insertMany = db.transaction((rows) => {
  for (const row of rows) insert.run(row)
})

export async function buildIndex(roots = getDrives(), onProgress = () => {}) {
  let lastProgressTime = 0

  db.exec('DELETE FROM files')
  startIndexInfo()

  const stack = [...roots]
  let batch = []
  let count = 0

  while (stack.length > 0) {
    const dir = stack.pop()

    let entries
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch (error) {
      console.log('Skipped:', dir, error.code)
      continue
    }

    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue // skip links/junctions -> avoids loops

      const fullPath = join(dir, entry.name)
      const isDirectory = entry.isDirectory()
      let size = null
      let modifiedAt = null

      try {
        const stats = await fs.stat(fullPath)
        size = isDirectory ? null : stats.size
        modifiedAt = stats.mtime.toISOString()
      } catch {
        // file locked or no access -> store without details
      }

      batch.push([randomUUID(), entry.name, fullPath, isDirectory ? 1 : 0, size, modifiedAt])

      const now = Date.now()
      if (now - lastProgressTime > 250) {
        onProgress(count + batch.length)
        lastProgressTime = now
      }

      if (isDirectory) stack.push(fullPath)

      if (batch.length >= BATCH_SIZE) {
        insertMany(batch)
        count += batch.length
        batch = []
      }
    }
  }

  insertMany(batch)
  count += batch.length
  finishIndexInfo(count)

  return count
}
