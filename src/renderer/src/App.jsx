import { useState, useEffect } from 'react'
import {
  Folder,
  File,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  Image,
  Film,
  Music,
  Presentation,
  LoaderCircle
} from 'lucide-react'

const FILE_TYPES = [
  { icon: FileText, color: 'text-sky-400', extensions: ['doc', 'docx', 'txt', 'rtf', 'odt', 'md'] },
  { icon: FileText, color: 'text-red-400', extensions: ['pdf'] },
  { icon: FileSpreadsheet, color: 'text-emerald-400', extensions: ['xls', 'xlsx', 'csv', 'ods'] },
  { icon: Presentation, color: 'text-orange-400', extensions: ['ppt', 'pptx', 'odp'] },
  {
    icon: Image,
    color: 'text-pink-400',
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp']
  },
  { icon: Film, color: 'text-violet-400', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv'] },
  { icon: Music, color: 'text-fuchsia-400', extensions: ['mp3', 'wav', 'flac', 'ogg', 'm4a'] },
  { icon: FileArchive, color: 'text-amber-400', extensions: ['zip', 'rar', '7z', 'tar', 'gz'] },
  {
    icon: FileCode,
    color: 'text-lime-400',
    extensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'php', 'py', 'sql']
  }
]

function getFileIcon(file) {
  if (file.is_directory) return { icon: Folder, color: 'text-cyan-400' }
  const extension = file.name.split('.').pop().toLowerCase()
  return (
    FILE_TYPES.find((type) => type.extensions.includes(extension)) ?? {
      icon: File,
      color: 'text-zinc-400'
    }
  )
}

function formatSize(bytes) {
  if (bytes == null) return ''
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toLocaleString('de-DE', { maximumFractionDigits: 1 })} ${units[unitIndex]}`
}

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function formatTimestamp(timestamp) {
  return new Date(timestamp.replace(' ', 'T') + 'Z').toLocaleString('de-DE')
}

function App() {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [isIndexing, setIsIndexing] = useState(false)
  const [status, setStatus] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [indexInfo, setIndexInfo] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [searchDuration, setSearchDuration] = useState(null)

  const [progressCount, setProgressCount] = useState(0)
  useEffect(() => {
    const unsubscribe = window.api.onIndexProgress(setProgressCount)
    return unsubscribe
  }, [])

  const handleBuildIndex = async () => {
    setProgressCount(0)
    setElapsedSeconds(0)
    setIsIndexing(true)
    setStatus('Indexiere ...')
    const startTime = Date.now()
    const count = await window.api.buildIndex()
    const duration = Math.round((Date.now() - startTime) / 1000)
    setStatus(
      `${count.toLocaleString('de-DE')} Einträge in ${formatDuration(duration)} min indexiert`
    )
    setIsIndexing(false)
    setIndexInfo(await window.api.getIndexInfo())
  }

  const handleSearch = async (event) => {
    event.preventDefault()
    if (!term.trim()) return
    const startTime = performance.now()
    const { items, total } = await window.api.search(term.trim())
    setSearchDuration(Math.round(performance.now() - startTime))
    setResults(items)
    setTotalCount(total)

    // const startTime = performance.now()
    // setResults(await window.api.search(term.trim()))
    // console.log(`Suche: ${Math.round(performance.now() - startTime)} ms`)
  }

  useEffect(() => {
    if (!isIndexing) return
    const startTime = Date.now()
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [isIndexing])

  const handleOpen = async (path) => {
    const error = await window.api.openFile(path)
    if (error) setStatus(`Fehler beim Öffnen: ${error}`)
  }

  useEffect(() => {
    window.api.getIndexInfo().then(setIndexInfo)
  }, [])

  return (
    <div className="h-screen flex flex-col">
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            fast<span className="text-cyan-400">search</span>
          </h1>
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span>{status}</span>
            <button
              onClick={handleBuildIndex}
              disabled={isIndexing}
              className="px-4 py-2 rounded-lg bg-cyan-500 text-zinc-950 font-semibold
                     hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Index neu aufbauen
            </button>
          </div>
        </header>
        <form onSubmit={handleSearch}>
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Suchbegriff ..."
            autoFocus
            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-3
                   placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </form>

        {totalCount > results.length && (
          <p className="text-sm text-amber-400">
            ⚠ Mehr als 200 Treffer ({totalCount.toLocaleString('de-DE')} gesamt), bitte die Suche
            weiter eingrenzen.
          </p>
        )}

        <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-900">
          {results.map((file) => {
            const { icon: Icon, color } = getFileIcon(file)
            return (
              <li
                key={file.id}
                onDoubleClick={() => handleOpen(file.path)}
                onContextMenu={(event) => {
                  event.preventDefault()
                  window.api.showInFolder(file.path)
                }}
                className="px-4 py-2 hover:bg-zinc-800 transition flex items-center gap-4 cursor-pointer select-none"
              >
                <Icon className={`w-5 h-5 shrink-0 ${color}`} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{file.name}</div>
                  <div className="text-xs text-zinc-500 truncate">{file.path}</div>
                </div>
                <div className="text-sm text-zinc-400 tabular-nums whitespace-nowrap">
                  {formatSize(file.size)}
                </div>
              </li>
            )
          })}
        </ul>
      </main>

      <footer className="flex items-center justify-between gap-4 border-t border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-500 select-none">
        <span>
          {!indexInfo && '⚠ Noch kein Index vorhanden'}
          {indexInfo && !indexInfo.is_finished && !isIndexing && (
            <span className="text-amber-400">⚠ Letzte Indexierung nicht abgeschlossen</span>
          )}
          {indexInfo?.is_finished === 1 &&
            `Last Index: ${formatTimestamp(indexInfo.finished_at)} · ${indexInfo.file_count.toLocaleString('de-DE')} Einträge`}
        </span>

        <span className="tabular-nums whitespace-nowrap">
          {searchDuration !== null &&
            `${results.length.toLocaleString('de-DE')} von ${totalCount.toLocaleString('de-DE')} Treffern · ${searchDuration} ms`}
        </span>
      </footer>

      {isIndexing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 px-10 py-8 shadow-2xl">
            <LoaderCircle className="w-10 h-10 text-cyan-400 animate-spin" />
            <div className="text-lg font-semibold">Index wird aufgebaut ...</div>
            <div className="text-2xl text-cyan-400 tabular-nums">
              {formatDuration(elapsedSeconds)}
            </div>
            <div className="text-sm text-zinc-400 tabular-nums">
              {progressCount.toLocaleString('de-DE')} Einträge
            </div>
            <div className="text-xs text-zinc-500">Das kann einige Minuten dauern.</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
