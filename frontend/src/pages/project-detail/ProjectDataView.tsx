import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ChangeEvent } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import type { Project } from '../../types/project'
import type { StorageConnection } from '../../types/storage'

interface ProjectOutletContext {
  project: Project
  workspaceName: string
}

interface FolderEntry {
  key: string
  name: string
  segments: string[]
  fullPrefix: string
}

interface FileEntry {
  key: string
  name: string
  objectPath: string
  size?: number
  updatedAt?: string
  contentType?: string
  storageClass?: string
}

const bytesFormatter = (bytes?: number) => {
  if (bytes == null) {
    return '—'
  }
  if (bytes === 0) {
    return '0 B'
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const size = bytes / 1024 ** index
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

const formatDateTime = (value?: string) => {
  if (!value) {
    return '—'
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

const ensureTrailingSlash = (value?: string) => {
  if (!value) {
    return ''
  }
  const trimmed = value.replace(/^\/+/, '').replace(/\/+$/, '')
  return trimmed.length > 0 ? `${trimmed}/` : ''
}

const composePrefix = (basePrefix: string, segments: string[]) => {
  if (segments.length === 0) {
    return basePrefix
  }
  const joined = segments.map((segment) => segment.replace(/\/+$/, '')).join('/')
  return `${basePrefix}${joined}/`
}

const stripBasePrefix = (fullPath: string, basePrefix: string) => {
  if (!basePrefix) {
    return fullPath
  }
  return fullPath.startsWith(basePrefix) ? fullPath.slice(basePrefix.length) : fullPath
}

function ProjectDataView() {
  const { project } = useOutletContext<ProjectOutletContext>()
  const { workspaceId, projectId } = useParams()
  const {
    listStorageConnections,
    listStorageObjects,
    createStorageUploadUrl,
    createStorageDownloadUrl,
    deleteStorageObject,
  } = useAuth()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [connections, setConnections] = useState<StorageConnection[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = useState(true)
  const [connectionsError, setConnectionsError] = useState<string | null>(null)
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)

  const [folderPath, setFolderPath] = useState<string[]>([])
  const [folders, setFolders] = useState<FolderEntry[]>([])
  const [files, setFiles] = useState<FileEntry[]>([])
  const [selectedFileKey, setSelectedFileKey] = useState<string | null>(null)
  const [listingError, setListingError] = useState<string | null>(null)
  const [isListing, setIsListing] = useState(false)

  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const selectedConnection = useMemo(
    () => connections.find((connection) => connection.id === selectedConnectionId) ?? null,
    [connections, selectedConnectionId],
  )

  const selectedFile = useMemo(
    () => files.find((file) => file.key === selectedFileKey) ?? null,
    [files, selectedFileKey],
  )

  useEffect(() => {
    if (!workspaceId || !projectId) {
      return
    }
    setIsLoadingConnections(true)
    setConnectionsError(null)

    listStorageConnections(workspaceId, projectId)
      .then((fetchedConnections) => {
        setConnections(fetchedConnections)
        if (fetchedConnections.length > 0) {
          setSelectedConnectionId((current) => current ?? fetchedConnections[0].id)
        } else {
          setSelectedConnectionId(null)
        }
      })
      .catch((error) => {
        setConnectionsError(error instanceof Error ? error.message : 'Unable to load storage connections.')
        setConnections([])
        setSelectedConnectionId(null)
      })
      .finally(() => {
        setIsLoadingConnections(false)
      })
  }, [listStorageConnections, workspaceId, projectId])

  useEffect(() => {
    // Reset folder path when switching buckets
    setFolderPath([])
    setFiles([])
    setFolders([])
    setSelectedFileKey(null)
    setListingError(null)
  }, [selectedConnectionId])

  const refreshListing = useCallback(
    async (connection: StorageConnection, segments: string[]) => {
      if (!workspaceId || !projectId) {
        return
      }

      setIsListing(true)
      setListingError(null)

      const basePrefix = ensureTrailingSlash(connection.prefix)
      const prefix = composePrefix(basePrefix, segments)

      try {
        const listing = await listStorageObjects(
          workspaceId,
          projectId,
          connection.bucketName,
          prefix.length > 0 ? prefix : undefined,
        )

        const folderEntries: FolderEntry[] = listing.folders.map((entry) => {
          const cleaned = stripBasePrefix(entry, basePrefix).replace(/\/+$/, '')
          const segmentsFromRoot = cleaned.split('/').filter(Boolean)
          const name = segmentsFromRoot[segmentsFromRoot.length - 1] ?? cleaned
          return {
            key: entry,
            name,
            segments: segmentsFromRoot,
            fullPrefix: entry,
          }
        })

        const currentPrefix = composePrefix(basePrefix, segments)

        const fileEntries: FileEntry[] = listing.files.map((file) => {
          const relativePath = stripBasePrefix(file.name, basePrefix)
          const displayName = currentPrefix
            ? stripBasePrefix(file.name, currentPrefix)
            : relativePath

          return {
            key: file.name,
            name: displayName || file.name,
            objectPath: file.name,
            size: file.size,
            updatedAt: file.updatedAt,
            contentType: file.contentType,
            storageClass: file.storageClass,
          }
        })

        setFolders(folderEntries)
        setFiles(fileEntries)
        // Preserve selection if still present; otherwise clear.
        setSelectedFileKey((previous) =>
          previous && fileEntries.some((file) => file.key === previous) ? previous : null,
        )
      } catch (error) {
        setListingError(error instanceof Error ? error.message : 'Unable to load bucket contents.')
        setFolders([])
        setFiles([])
        setSelectedFileKey(null)
      } finally {
        setIsListing(false)
      }
    },
    [listStorageObjects, workspaceId, projectId],
  )

  useEffect(() => {
    if (!selectedConnection) {
      return
    }
    refreshListing(selectedConnection, folderPath).catch(() => {
      // refreshListing handles its own error state
    })
  }, [selectedConnection, folderPath, refreshListing])

  const handleSelectFolder = (entry: FolderEntry) => {
    setFolderPath(entry.segments)
    setSelectedFileKey(null)
  }

  const handleBreadcrumbClick = (segments: string[]) => {
    setFolderPath(segments)
    setSelectedFileKey(null)
  }

  const breadcrumbs = useMemo(() => {
    const crumbs: { label: string; segments: string[] }[] = [{ label: 'Root', segments: [] }]
    folderPath.forEach((segment, index) => {
      crumbs.push({ label: segment, segments: folderPath.slice(0, index + 1) })
    })
    return crumbs
  }, [folderPath])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedConnection || !workspaceId || !projectId) {
      return
    }

    const { files: fileList } = event.target
    if (!fileList || fileList.length === 0) {
      return
    }

    setIsUploading(true)
    setUploadError(null)

    const basePrefix = ensureTrailingSlash(selectedConnection.prefix)
    const currentPrefix = composePrefix(basePrefix, folderPath)

    try {
      for (const file of Array.from(fileList)) {
        const objectPath = `${currentPrefix}${file.name}`
        const { url } = await createStorageUploadUrl(workspaceId, projectId, {
          bucketName: selectedConnection.bucketName,
          objectPath,
          contentType: file.type || 'application/octet-stream',
        })

        const uploadResponse = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        })

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }
      }

      await refreshListing(selectedConnection, folderPath)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleDownload = async (file: FileEntry) => {
    if (!selectedConnection || !workspaceId || !projectId) {
      return
    }
    try {
      const { url } = await createStorageDownloadUrl(workspaceId, projectId, {
        bucketName: selectedConnection.bucketName,
        objectPath: file.objectPath,
      })
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      setListingError(error instanceof Error ? error.message : 'Unable to generate download link.')
    }
  }

  const handleDelete = async (file: FileEntry) => {
    if (!selectedConnection || !workspaceId || !projectId) {
      return
    }
    try {
      await deleteStorageObject(workspaceId, projectId, {
        bucketName: selectedConnection.bucketName,
        objectPath: file.objectPath,
      })
      await refreshListing(selectedConnection, folderPath)
    } catch (error) {
      setListingError(error instanceof Error ? error.message : 'Unable to delete object.')
    }
  }

  const totalFiles = useMemo(() => files.length, [files])
  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + (file.size ?? 0), 0),
    [files],
  )

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-brand-text">
            {project.name} <span className="text-brand-muted">/ Data</span>
          </h2>
          <p className="text-sm text-brand-body">
            Browse linked GCP buckets, explore nested folders, and manage project artifacts directly from omX.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/30 text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/10"
            aria-label="Refresh"
            onClick={() => {
              if (selectedConnection) {
                refreshListing(selectedConnection, folderPath).catch(() => {})
              }
            }}
          >
            <svg
              aria-hidden
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v6h6"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 20v-6h-6"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.64 18.36A9 9 0 108.46 5.64"
              />
            </svg>
          </button>
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
            className="hidden"
            onChange={handleFilesSelected}
          />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted">
        <span className="rounded-full bg-brand-primary/10 px-3 py-1 font-semibold text-brand-primary">
          {totalFiles} files
        </span>
        <span className="rounded-full bg-brand-primary/5 px-3 py-1">{bytesFormatter(totalSize)} total size</span>
        {selectedConnection && (
          <span className="rounded-full bg-white/70 px-3 py-1">
            {selectedConnection.bucketName}
            {selectedConnection.prefix ? ` / ${selectedConnection.prefix}` : ''}
          </span>
        )}
      </div>

      {breadcrumbs.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-brand-muted">
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={crumb.label + index}>
              <button
                type="button"
                onClick={() => handleBreadcrumbClick(crumb.segments)}
                className={`rounded-full px-3 py-1 transition ${
                  crumb.segments.length === folderPath.length
                    ? 'bg-brand-primary/15 text-brand-primary'
                    : 'hover:bg-brand-primary/10'
                }`}
              >
                {crumb.label}
              </button>
              {index < breadcrumbs.length - 1 && <span className="text-brand-muted">/</span>}
            </Fragment>
          ))}
        </div>
      )}

      {connectionsError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {connectionsError}
        </div>
      )}

      {uploadError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {uploadError}
        </div>
      )}

      {listingError && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {listingError}
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-brand-primary/20 bg-white/90">
        <div className="flex flex-1 flex-col divide-y divide-brand-primary/15 lg:flex-row lg:divide-x lg:divide-y-0">
          <section className="flex min-h-[200px] flex-1 flex-col border-b border-brand-primary/15 bg-white/80 lg:max-w-[240px] lg:border-b-0">
            <header className="flex items-center gap-2 border-b border-brand-primary/15 bg-white/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-muted">
              <svg
                aria-hidden
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <circle cx="12" cy="6" r="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 21v-3a4 4 0 014-4h6a4 4 0 014 4v3" />
              </svg>
              GCP Buckets
            </header>
            <div className="flex-1 overflow-y-auto">
              {isLoadingConnections && (
                <div className="flex h-full items-center justify-center px-4 py-6 text-sm text-brand-muted">
                  Loading connections…
                </div>
              )}
              {!isLoadingConnections && connections.length === 0 && (
                <div className="flex h-full items-center justify-center px-4 py-6 text-center text-xs text-brand-muted">
                  Link a bucket in project settings to browse GCS content here.
                </div>
              )}
              {connections.map((connection) => (
                <button
                  type="button"
                  key={connection.id}
                  onClick={() => setSelectedConnectionId(connection.id)}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                    connection.id === selectedConnectionId
                      ? 'bg-brand-primary/15 text-brand-primary'
                      : 'text-brand-text hover:bg-brand-primary/10'
                  }`}
                >
                  <span className="text-sm font-semibold">{connection.bucketName}</span>
                  <span className="text-xs text-brand-muted">
                    {connection.prefix ? connection.prefix : 'Full bucket'}
                  </span>
                  {connection.gcpProjectId && (
                    <span className="text-[11px] uppercase tracking-[0.2em] text-brand-muted">
                      Project: {connection.gcpProjectId}
                    </span>
                  )}
                  {connection.description && (
                    <span className="text-[11px] text-brand-muted line-clamp-2">{connection.description}</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="flex min-h-[200px] flex-1 flex-col lg:max-w-[260px]">
            <div className="flex-1 overflow-y-auto py-2">
              {selectedConnection ? (
                folders.length === 0 ? (
                  <div className="flex h-full items-center justify-center px-4 text-xs text-brand-muted">
                    {isListing ? 'Loading folders…' : 'No nested folders in this path.'}
                  </div>
                ) : (
                  folders.map((folder) => (
                    <button
                      type="button"
                      key={folder.key}
                      onClick={() => handleSelectFolder(folder)}
                      className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                        folder.segments.length === folderPath.length &&
                        folder.segments.every((segment, index) => segment === folderPath[index])
                          ? 'bg-brand-primary/15 text-brand-primary'
                          : 'text-brand-text hover:bg-brand-primary/10'
                      }`}
                    >
                      <span className="text-sm font-semibold">{folder.name}</span>
                      <span className="text-xs text-brand-muted">/{folder.segments.join('/')}</span>
                    </button>
                  ))
                )
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-xs text-brand-muted">
                  Select a bucket to explore folders.
                </div>
              )}
            </div>
          </section>

          <section className="flex min-h-[200px] flex-1 flex-col">
            <div className="flex-1 overflow-y-auto py-2">
              {selectedConnection ? (
                files.length === 0 ? (
                  <div className="flex h-full items-center justify-center px-4 text-xs text-brand-muted">
                    {isListing ? 'Loading files…' : 'No files present in this folder.'}
                  </div>
                ) : (
                  files.map((file) => (
                    <button
                      type="button"
                      key={file.key}
                      onClick={() => setSelectedFileKey(file.key)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                        file.key === selectedFileKey
                          ? 'bg-brand-primary/15 text-brand-primary'
                          : 'text-brand-text hover:bg-brand-primary/10'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{file.name}</p>
                        <p className="truncate text-xs text-brand-muted">
                          {bytesFormatter(file.size)} · {formatDateTime(file.updatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleDownload(file).catch(() => {})
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-brand-primary/40 px-3 py-1 text-[11px] font-semibold text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/10"
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleDelete(file).catch(() => {})
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1 text-[11px] font-semibold text-red-500 transition hover:border-red-400 hover:bg-red-100/70"
                        >
                          Delete
                        </button>
                      </div>
                    </button>
                  ))
                )
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-xs text-brand-muted">
                  Select a bucket to view files.
                </div>
              )}
            </div>
          </section>

          <aside className="hidden min-h-[200px] w-full flex-col bg-white/60 px-6 py-5 text-sm text-brand-body lg:flex lg:max-w-[300px]">
            {selectedFile ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-muted">Selected file</p>
                  <h3 className="mt-2 text-lg font-semibold text-brand-text">{selectedFile.name}</h3>
                  <p className="text-xs text-brand-muted">{selectedFile.objectPath}</p>
                </div>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-brand-muted">Size</dt>
                    <dd className="font-semibold text-brand-text">{bytesFormatter(selectedFile.size)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-brand-muted">Updated</dt>
                    <dd className="font-semibold text-brand-text">{formatDateTime(selectedFile.updatedAt)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-brand-muted">Content type</dt>
                    <dd className="font-semibold text-brand-text">{selectedFile.contentType ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-brand-muted">Storage class</dt>
                    <dd className="font-semibold text-brand-text">{selectedFile.storageClass ?? '—'}</dd>
                  </div>
                </dl>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(selectedFile).catch(() => {})}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-primary/40 px-4 py-2 text-xs font-semibold text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/10"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedFile).catch(() => {})}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-500 transition hover:border-red-400 hover:bg-red-100/70"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-xs text-brand-muted">
                Select a file to see metadata, download links, and retention details.
              </div>
            )}
          </aside>
        </div>
      </div>

      {isUploading && (
        <div className="flex items-center gap-3 rounded-3xl border border-brand-primary/20 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary">
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
    </div>
  )
}

export default ProjectDataView
