import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

interface ProjectFile {
  id: string
  name: string
  extension: string
  type: string
  size: number
  uploadedAt: string
  uploadedBy: string
  source: 'sample' | 'local'
  url?: string
}

const sampleFiles: ProjectFile[] = [
  {
    id: '1',
    name: 'training_data.csv',
    extension: 'csv',
    type: 'text/csv',
    size: 2456789,
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    uploadedBy: 'Alex Rivers',
    source: 'sample',
  },
  {
    id: '2',
    name: 'model-notes.md',
    extension: 'md',
    type: 'text/markdown',
    size: 12678,
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    uploadedBy: 'Jamie Lin',
    source: 'sample',
  },
  {
    id: '3',
    name: 'experiment-metrics.json',
    extension: 'json',
    type: 'application/json',
    size: 657890,
    uploadedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    uploadedBy: 'You',
    source: 'sample',
  },
]

const typeLabels: Record<string, string> = {
  csv: 'CSV',
  md: 'Markdown',
  json: 'JSON',
  ipynb: 'Notebook',
  xlsx: 'Spreadsheet',
  parquet: 'Parquet',
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) {
    return '0 B'
  }
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const size = bytes / 1024 ** index
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const extensionFromName = (name: string) => {
  const parts = name.toLowerCase().split('.')
  if (parts.length <= 1) {
    return 'txt'
  }
  return parts.pop() ?? 'txt'
}

const createFileIcon = (extension: string) => {
  switch (extension) {
    case 'csv':
    case 'xlsx':
      return (
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-semibold text-emerald-600">
          CSV
        </span>
      )
    case 'json':
      return (
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-sm font-semibold text-blue-600">
          {extension.toUpperCase()}
        </span>
      )
    case 'md':
      return (
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-sm font-semibold text-amber-600">
          MD
        </span>
      )
    case 'ipynb':
      return (
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-xs font-semibold text-purple-600">
          NB
        </span>
      )
    default:
      return (
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/15 text-sm font-semibold text-brand-primary">
          {extension.slice(0, 3).toUpperCase()}
        </span>
      )
  }
}

function ProjectDataView() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const localFileUrlsRef = useRef<Set<string>>(new Set())
  const [files, setFiles] = useState<ProjectFile[]>(sampleFiles)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    return () => {
      localFileUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url)
      })
      localFileUrlsRef.current.clear()
    }
  }, [])

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === 'all' || file.extension === typeFilter
      return matchesSearch && matchesType
    })
  }, [files, searchTerm, typeFilter])

  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files],
  )

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return
    }
    const selectedFiles = Array.from(event.target.files)

    setIsUploading(true)

    const newEntries: ProjectFile[] = selectedFiles.map((file) => {
      const extension = extensionFromName(file.name)
      const url = URL.createObjectURL(file)
      localFileUrlsRef.current.add(url)
      return {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        name: file.name,
        extension,
        type: file.type || 'application/octet-stream',
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'You',
        source: 'local',
        url,
      }
    })

    // Simulate minimal upload delay for progress feedback
    setTimeout(() => {
      setFiles((previous) => [...newEntries, ...previous])
      setIsUploading(false)
    }, 600)

    event.target.value = ''
  }

  const handleDelete = (id: string) => {
    setFiles((previous) => {
      const fileToRemove = previous.find((file) => file.id === id)
      if (fileToRemove?.url) {
        URL.revokeObjectURL(fileToRemove.url)
        localFileUrlsRef.current.delete(fileToRemove.url)
      }
      return previous.filter((file) => file.id !== id)
    })
  }

  const typeOptions = useMemo(() => {
    const extensions = Array.from(new Set(files.map((file) => file.extension)))
    return extensions
      .filter((value) => value.length > 0)
      .sort()
  }, [files])

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-brand-text">Data</h2>
          <p className="text-sm text-brand-body">
            Upload datasets, notebooks, and documentation that power this project. Everything stays in sync for your team.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-brand-muted">
          <span className="rounded-full bg-brand-primary/10 px-3 py-1 font-semibold text-brand-primary">
            {files.length} files
          </span>
          <span className="rounded-full bg-brand-primary/5 px-3 py-1">
            {formatFileSize(totalSize)} total
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-primary/20 bg-white/60 p-4">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search files"
            className="w-full rounded-full border border-brand-primary/30 bg-white px-4 py-2 pl-11 text-sm text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus:outline-none"
          />
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-brand-muted">
            <svg
              aria-hidden
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="11" cy="11" r="6" />
              <path d="M20 20l-3-3" />
            </svg>
          </span>
        </div>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="min-w-[150px] rounded-full border border-brand-primary/30 bg-white px-4 py-2 text-sm text-brand-text focus:border-brand-primary focus:outline-none"
        >
          <option value="all">All types</option>
          {typeOptions.map((extension) => (
            <option key={extension} value={extension}>
              {typeLabels[extension] ?? extension.toUpperCase()}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleUploadClick}
          className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          <svg
            aria-hidden
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          </svg>
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
        />
      </div>

      {isUploading && (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-primary/20 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-primary/30">
            <svg
              aria-hidden
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4 animate-spin"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v4M12 16v4M4 12h4M16 12h4M5.64 5.64l2.83 2.83M15.53 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.53 8.47l2.83-2.83"
              />
            </svg>
          </span>
          Uploading files…
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {filteredFiles.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-brand-primary/30 bg-white/70 p-10 text-center">
            <h3 className="text-lg font-semibold text-brand-text">No files found</h3>
            <p className="mt-2 text-sm text-brand-body">
              Try adjusting your search or upload a new dataset to get started.
            </p>
            <button
              type="button"
              onClick={handleUploadClick}
              className="mt-6 rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
            >
              Upload files
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-brand-primary/15 rounded-2xl border border-brand-primary/20 bg-white/80">
            {filteredFiles.map((file) => (
              <li key={file.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:gap-0">
                <div className="flex items-center gap-4 sm:w-1/3">
                  {createFileIcon(file.extension)}
                  <div>
                    <p className="text-sm font-semibold text-brand-text">{file.name}</p>
                    <p className="text-xs text-brand-muted">
                      {typeLabels[file.extension] ?? file.extension.toUpperCase()} · {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col items-start gap-2 text-xs text-brand-muted sm:flex-row sm:items-center sm:justify-between">
                  <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-brand-primary">
                    Uploaded by {file.uploadedBy}
                  </span>
                  <span>{dateFormatter.format(new Date(file.uploadedAt))}</span>
                </div>
                <div className="flex items-center gap-2 sm:w-48 sm:justify-end">
                  {file.url ? (
                    <a
                      href={file.url}
                      download={file.name}
                      className="inline-flex items-center gap-2 rounded-full border border-brand-primary/40 px-3 py-1 text-xs font-semibold text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/10"
                    >
                      Download
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-brand-primary/40 px-3 py-1 text-xs font-semibold text-brand-primary opacity-70"
                      disabled
                    >
                      Download
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(file.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 transition hover:border-red-400 hover:bg-red-100/70"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ProjectDataView
