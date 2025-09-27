import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useOutletContext } from 'react-router-dom'

import type { Project } from '../../types/project'

interface ProjectOutletContext {
  project: Project
  workspaceName: string
}

interface ProjectFile {
  id: string
  name: string
  sizeBytes: number
  updatedAt: string
  owner: string
  kind: 'file' | 'image' | 'notebook' | 'folder'
  description?: string
  url?: string
}

interface Dataset {
  id: string
  name: string
  description?: string
  files: ProjectFile[]
}

interface Collection {
  id: string
  name: string
  path: string
  owner: string
  datasets: Dataset[]
}

const defaultCollections: Collection[] = [
  {
    id: 'azizi-lab',
    name: 'azizilab-aml',
    path: 'azizilab-aml/khushi-crc',
    owner: 'Alex Rivers',
    datasets: [
      {
        id: 'xenium-sample-1',
        name: 'xenium_outs_sample1',
        description: 'Spatial transcriptomics output for CRC sample 1.',
        files: [
          {
            id: 'file-exp-1',
            name: 'experiment.xenium',
            sizeBytes: 2_456_789_012,
            updatedAt: '2024-02-02T14:20:00Z',
            owner: 'Alex Rivers',
            kind: 'file',
            description: 'Primary experiment manifest generated from Xenium run.',
          },
          {
            id: 'file-morph-1',
            name: 'morphology.tiff',
            sizeBytes: 856_322_189,
            updatedAt: '2024-01-30T10:05:00Z',
            owner: 'Jamie Lin',
            kind: 'image',
            description: 'High-resolution morphology reference for segmentation overlay.',
          },
          {
            id: 'file-cells-1',
            name: 'cells.zarr',
            sizeBytes: 1_276_500_431,
            updatedAt: '2024-01-28T09:12:00Z',
            owner: 'Taylor Chen',
            kind: 'file',
            description: 'Cell-level expression matrix stored as chunked Zarr.',
          },
          {
            id: 'file-metadata-1',
            name: 'metadata.json',
            sizeBytes: 98_765,
            updatedAt: '2024-01-28T09:05:00Z',
            owner: 'Alex Rivers',
            kind: 'file',
            description: 'Pipeline configuration and annotations.',
          },
        ],
      },
      {
        id: 'xenium-sample-2',
        name: 'xenium_outs_sample2',
        description: 'Matched CRC sample 2 processed through the same workflow.',
        files: [
          {
            id: 'file-exp-2',
            name: 'experiment.xenium',
            sizeBytes: 2_278_901_233,
            updatedAt: '2024-02-04T13:50:00Z',
            owner: 'You',
            kind: 'file',
            description: 'Experiment manifest uploaded from local workstation.',
          },
          {
            id: 'file-cells-2',
            name: 'cells.zarr',
            sizeBytes: 1_156_340_210,
            updatedAt: '2024-02-03T17:12:00Z',
            owner: 'Jamie Lin',
            kind: 'file',
          },
          {
            id: 'file-notebook-2',
            name: 'qc-review.ipynb',
            sizeBytes: 4_239_812,
            updatedAt: '2024-02-05T08:32:00Z',
            owner: 'You',
            kind: 'notebook',
            description: 'Quality control checks for sequencing depth and spatial coverage.',
          },
        ],
      },
      {
        id: 'xenium-sample-3',
        name: 'xenium_outs_sample3',
        description: 'Fresh import awaiting QC.',
        files: [
          {
            id: 'file-readme-3',
            name: 'README.md',
            sizeBytes: 12_345,
            updatedAt: '2024-02-08T09:45:00Z',
            owner: 'Taylor Chen',
            kind: 'file',
            description: 'Checklist for what remains to be validated before analysis.',
          },
        ],
      },
    ],
  },
  {
    id: 'public-releases',
    name: 'public-datasets',
    path: 'shared/public',
    owner: 'Shared',
    datasets: [
      {
        id: 'atlas',
        name: 'spatial_atlas_release',
        description: 'Reference atlas for benchmarking segmentation performance.',
        files: [
          {
            id: 'file-atlas',
            name: 'atlas-summary.parquet',
            sizeBytes: 678_901_233,
            updatedAt: '2023-12-20T11:22:00Z',
            owner: 'Data Platform',
            kind: 'file',
          },
          {
            id: 'file-figures',
            name: 'figures.zip',
            sizeBytes: 145_332_120,
            updatedAt: '2023-12-18T15:42:00Z',
            owner: 'Data Platform',
            kind: 'file',
          },
        ],
      },
    ],
  },
]

const firstCollection = defaultCollections[0] ?? null
const firstDataset = firstCollection?.datasets[0] ?? null
const firstFile = firstDataset?.files[0] ?? null

const formatBytes = (bytes: number) => {
  if (bytes === 0) {
    return '0 B'
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const size = bytes / 1024 ** index
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

const updatedAtFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function ProjectDataView() {
  const { project } = useOutletContext<ProjectOutletContext>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const localFileUrlsRef = useRef<Set<string>>(new Set())

  const [collections, setCollections] = useState<Collection[]>(defaultCollections)
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(firstCollection?.id ?? null)
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(firstDataset?.id ?? null)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(firstFile?.id ?? null)

  const selectedCollection = useMemo(
    () => collections.find((collection) => collection.id === selectedCollectionId) ?? null,
    [collections, selectedCollectionId],
  )

  const selectedDataset = useMemo(
    () => selectedCollection?.datasets.find((dataset) => dataset.id === selectedDatasetId) ?? null,
    [selectedCollection, selectedDatasetId],
  )

  const selectedFile = useMemo(
    () => selectedDataset?.files.find((file) => file.id === selectedFileId) ?? null,
    [selectedDataset, selectedFileId],
  )

  useEffect(() => {
    setSelectedDatasetId((previous) => {
      if (previous && selectedCollection?.datasets.some((dataset) => dataset.id === previous)) {
        return previous
      }
      return selectedCollection?.datasets[0]?.id ?? null
    })
  }, [selectedCollection])

  useEffect(() => {
    setSelectedFileId((previous) => {
      if (previous && selectedDataset?.files.some((file) => file.id === previous)) {
        return previous
      }
      return selectedDataset?.files[0]?.id ?? null
    })
  }, [selectedDataset])

  useEffect(() => {
    return () => {
      localFileUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url)
      })
      localFileUrlsRef.current.clear()
    }
  }, [])

  const totalFiles = useMemo(() => {
    return collections.reduce((collectionSum, collection) => {
      return (
        collectionSum +
        collection.datasets.reduce((datasetSum, dataset) => datasetSum + dataset.files.length, 0)
      )
    }, 0)
  }, [collections])

  const totalSize = useMemo(() => {
    return collections.reduce((collectionSum, collection) => {
      return (
        collectionSum +
        collection.datasets.reduce(
          (datasetSum, dataset) =>
            datasetSum + dataset.files.reduce((fileSum, file) => fileSum + file.sizeBytes, 0),
          0,
        )
      )
    }, 0)
  }, [collections])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedCollection || !selectedDataset) {
      event.target.value = ''
      return
    }
    const { files: fileList } = event.target
    if (!fileList || fileList.length === 0) {
      return
    }

    const newFiles: ProjectFile[] = Array.from(fileList).map((file) => {
      const url = URL.createObjectURL(file)
      localFileUrlsRef.current.add(url)
      return {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        name: file.name,
        sizeBytes: file.size,
        updatedAt: new Date().toISOString(),
        owner: 'You',
        kind: 'file',
        description: 'Uploaded from your device.',
        url,
      }
    })

    setCollections((previous) =>
      previous.map((collection) => {
        if (collection.id !== selectedCollection.id) {
          return collection
        }
        return {
          ...collection,
          datasets: collection.datasets.map((dataset) => {
            if (dataset.id !== selectedDataset.id) {
              return dataset
            }
            return {
              ...dataset,
              files: [...newFiles, ...dataset.files],
            }
          }),
        }
      }),
    )

    setSelectedFileId(newFiles[0]?.id ?? selectedDataset.files[0]?.id ?? null)
    event.target.value = ''
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-brand-text">
            {project.name} <span className="text-brand-muted">/ Data</span>
          </h2>
          <p className="text-sm text-brand-body">
            Browse project datasets, drill into nested outputs, and keep context as you move across columns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/30 text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/10"
            aria-label="Toggle dense view"
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14M5 12h14M5 17h14" />
            </svg>
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/30 text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/10"
            aria-label="Search files"
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
              <circle cx="11" cy="11" r="6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 20l-3-3" />
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
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted">
        <span className="rounded-full bg-brand-primary/10 px-3 py-1 font-semibold text-brand-primary">
          {totalFiles} files indexed
        </span>
        <span className="rounded-full bg-brand-primary/5 px-3 py-1">{formatBytes(totalSize)} total size</span>
        {selectedCollection && (
          <span className="rounded-full bg-white/70 px-3 py-1">
            {selectedCollection.path}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-brand-primary/20 bg-white/85 shadow-inner">
        <div className="flex flex-1 flex-col divide-y divide-brand-primary/15 lg:flex-row lg:divide-x lg:divide-y-0">
          <section className="flex min-h-[200px] flex-1 flex-col lg:max-w-[240px]">
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
              {collections.map((collection) => {
                const isActive = collection.id === selectedCollection?.id
                return (
                  <button
                    type="button"
                    key={collection.id}
                    onClick={() => setSelectedCollectionId(collection.id)}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                      isActive
                        ? 'bg-brand-primary/15 text-brand-primary'
                        : 'text-brand-text hover:bg-brand-primary/10'
                    }`}
                  >
                    <span className="text-sm font-semibold">{collection.name}</span>
                    <span className="text-xs text-brand-muted">{collection.path}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="flex min-h-[200px] flex-1 flex-col lg:max-w-[260px]">
            <div className="flex-1 overflow-y-auto py-2">
              {selectedCollection ? (
                selectedCollection.datasets.map((dataset) => {
                  const isActive = dataset.id === selectedDataset?.id
                  return (
                    <button
                      type="button"
                      key={dataset.id}
                      onClick={() => setSelectedDatasetId(dataset.id)}
                      className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                        isActive
                          ? 'bg-brand-primary/15 text-brand-primary'
                          : 'text-brand-text hover:bg-brand-primary/10'
                      }`}
                    >
                      <span className="text-sm font-semibold">{dataset.name}</span>
                      {dataset.description && (
                        <span className="text-xs text-brand-muted line-clamp-2">{dataset.description}</span>
                      )}
                    </button>
                  )
                })
              ) : (
                <div className="flex h-full items-center justify-center px-4">
                  <p className="text-xs text-brand-muted">Select a collection to view datasets.</p>
                </div>
              )}
            </div>
          </section>

          <section className="flex min-h-[200px] flex-1 flex-col">
            <div className="flex-1 overflow-y-auto py-2">
              {selectedDataset && (
                <div className="flex items-center justify-end px-4 pb-2 text-[10px] font-medium text-brand-muted">
                  {selectedDataset.files.length} items
                </div>
              )}
              {selectedDataset ? (
                selectedDataset.files.map((file) => {
                  const isActive = file.id === selectedFile?.id
                  return (
                    <button
                      type="button"
                      key={file.id}
                      onClick={() => setSelectedFileId(file.id)}
                      className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition ${
                        isActive
                          ? 'bg-brand-primary/15 text-brand-primary'
                          : 'text-brand-text hover:bg-brand-primary/10'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{file.name}</p>
                        <p className="truncate text-xs text-brand-muted">
                          {formatBytes(file.sizeBytes)} · {shortDateFormatter.format(new Date(file.updatedAt))}
                        </p>
                      </div>
                      <span className="text-[11px] uppercase tracking-[0.25em] text-brand-muted">
                        {file.kind === 'image'
                          ? 'IMG'
                          : file.kind === 'notebook'
                          ? 'NB'
                          : 'FILE'}
                      </span>
                    </button>
                  )
                })
              ) : (
                <div className="flex h-full items-center justify-center px-4">
                  <p className="text-xs text-brand-muted">Select a dataset to explore its files.</p>
                </div>
              )}
            </div>
          </section>

          <aside className="hidden min-h-[200px] w-full flex-col bg-white/60 px-6 py-5 text-sm text-brand-body lg:flex lg:max-w-[280px]">
            {selectedFile ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-muted">Selected file</p>
                  <h3 className="mt-2 text-lg font-semibold text-brand-text">{selectedFile.name}</h3>
                  {selectedDataset && (
                    <p className="text-xs text-brand-muted">
                      {selectedCollection?.path}/{selectedDataset.name}
                    </p>
                  )}
                </div>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-brand-muted">Size</dt>
                    <dd className="font-semibold text-brand-text">{formatBytes(selectedFile.sizeBytes)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-brand-muted">Last updated</dt>
                    <dd className="font-semibold text-brand-text">
                      {updatedAtFormatter.format(new Date(selectedFile.updatedAt))}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-brand-muted">Owner</dt>
                    <dd className="font-semibold text-brand-text">{selectedFile.owner}</dd>
                  </div>
                </dl>
                {selectedFile.description && (
                  <div className="rounded-2xl bg-brand-primary/10 px-4 py-3 text-xs text-brand-body">
                    {selectedFile.description}
                  </div>
                )}
                {selectedFile.url ? (
                  <a
                    href={selectedFile.url}
                    download={selectedFile.name}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-brand-primary/40 px-4 py-2 text-xs font-semibold text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/10"
                  >
                    Download
                  </a>
                ) : (
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-brand-primary/40 px-4 py-2 text-xs font-semibold text-brand-primary opacity-70"
                    disabled
                  >
                    Download
                  </button>
                )}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-xs text-brand-muted">
                Select a file to inspect metadata and download options.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

export default ProjectDataView
