import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'

const localAppData = process.env.LOCALAPPDATA ?? app.getPath('userData')
const dataDirectory = join(localAppData, app.getName())
mkdirSync(dataDirectory, { recursive: true })

const SEARCH_LIMIT = 200

const db = new Database(join(dataDirectory, 'FastSearch.db'))
db.pragma('journal_mode = WAL')

// Insert statement and transaction for batch inserts
db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id           VARCHAR(36) PRIMARY KEY,
    name         TEXT NOT NULL,
    path         TEXT NOT NULL UNIQUE,
    is_directory INTEGER NOT NULL,
    size         INTEGER,
    modified_at  TIMESTAMP,
    created_by   VARCHAR(36),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by   VARCHAR(36),
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_files_name ON files(name);

  CREATE TRIGGER IF NOT EXISTS trg_files_updated_at
  AFTER UPDATE ON files
  BEGIN
    UPDATE files SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
`)

const searchStatement = db.prepare(`
  SELECT id, name, path, is_directory, size, modified_at
  FROM files
  WHERE name LIKE ? ESCAPE '\\'
  ORDER BY name
  LIMIT ${SEARCH_LIMIT}
`)

const countStatement = db.prepare(`
  SELECT COUNT(*) AS total
  FROM files
  WHERE name LIKE ? ESCAPE '\\'
`)

function toLikePattern(term) {
  const escaped = term.replace(/[\\%_]/g, (char) => '\\' + char)
  const pattern = escaped.replace(/\*/g, '%').replace(/\?/g, '_')
  const hasWildcard = /[*?]/.test(term)
  return hasWildcard ? pattern : `%${pattern}%`
}

export function searchFiles(term) {
  const pattern = toLikePattern(term)
  const items = searchStatement.all(pattern)
  const total = items.length < SEARCH_LIMIT ? items.length : countStatement.get(pattern).total
  return { items, total }
}

// Index info table and statements
db.exec(`
  CREATE TABLE IF NOT EXISTS index_info (
    id          INTEGER PRIMARY KEY CHECK (id = 1),
    is_finished INTEGER NOT NULL DEFAULT 0,
    file_count  INTEGER,
    started_at  TIMESTAMP NOT NULL,
    finished_at TIMESTAMP
  )
`)

const startInfoStatement = db.prepare(`
  INSERT OR REPLACE INTO index_info (id, is_finished, file_count, started_at, finished_at)
  VALUES (1, 0, NULL, CURRENT_TIMESTAMP, NULL)
`)
const finishInfoStatement = db.prepare(`
  UPDATE index_info
  SET is_finished = 1, file_count = ?, finished_at = CURRENT_TIMESTAMP
  WHERE id = 1
`)
const getInfoStatement = db.prepare('SELECT * FROM index_info WHERE id = 1')

export function startIndexInfo() {
  startInfoStatement.run()
}

export function finishIndexInfo(count) {
  finishInfoStatement.run(count)
}

export function getIndexInfo() {
  return getInfoStatement.get() ?? null
}

export default db
