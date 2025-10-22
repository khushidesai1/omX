import { useMemo, useState } from 'react'

interface ProjectDashboard {
  id: string
  title: string
  description: string
  owner: string
  updatedAt: string
  tags: string[]
}

const sampleDashboards: ProjectDashboard[] = [
  {
    id: 'dash-1',
    title: 'Operations Overview',
    description: 'Track key metrics across ingestion, transforms, and outbound models.',
    owner: 'Alex Rivers',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    tags: ['core', 'metrics'],
  },
  {
    id: 'dash-2',
    title: 'Model Performance',
    description: 'Monitor precision, recall, and latency across deployed versions.',
    owner: 'Jamie Lin',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString(),
    tags: ['ml', 'quality'],
  },
  {
    id: 'dash-3',
    title: 'Data Freshness',
    description: 'Ensure SLAs are met with freshness monitoring and pipeline health.',
    owner: 'Taylor Chen',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    tags: ['ops'],
  },
]

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function ProjectDashboardsView() {
  const [dashboards, setDashboards] = useState<ProjectDashboard[]>(sampleDashboards)
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredDashboards = useMemo(() => {
    return dashboards.filter((dashboard) => {
      const needle = searchTerm.toLowerCase()
      return (
        dashboard.title.toLowerCase().includes(needle) ||
        dashboard.description.toLowerCase().includes(needle) ||
        dashboard.tags.some((tag) => tag.toLowerCase().includes(needle))
      )
    })
  }, [dashboards, searchTerm])

  const handleCreateDashboard = () => {
    if (!newTitle.trim()) {
      return
    }

    const now = new Date().toISOString()
    setDashboards((previous) => [
      {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        title: newTitle.trim(),
        description: newDescription.trim() || 'Describe the purpose of this dashboard.',
        owner: 'You',
        updatedAt: now,
        tags: ['draft'],
      },
      ...previous,
    ])

    setNewTitle('')
    setNewDescription('')
    setIsCreating(false)
  }

  const handleDelete = (id: string) => {
    setDashboards((previous) => previous.filter((dashboard) => dashboard.id !== id))
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-brand-text">Dashboards</h2>
          <p className="text-sm text-brand-body">
            Visualize project insights, connect metrics, and share results. Dashboards update automatically as data changes.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-brand-muted">
          <span className="rounded-full bg-brand-primary/10 px-3 py-1 font-semibold text-brand-primary">
            {dashboards.length} dashboards
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-primary/20 bg-white/60 p-4">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search dashboards"
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
        <button
          type="button"
          onClick={() => setIsCreating(true)}
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
          New dashboard
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {isCreating ? (
          <div className="relative flex aspect-square flex-col gap-4 rounded-3xl border border-brand-primary/30 bg-white/80 p-5 shadow-lg">
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-brand-primary/30 bg-brand-primary/5 text-brand-muted">
              Configure your layout after saving.
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Dashboard title"
                className="w-full rounded-2xl border border-brand-primary/30 bg-white px-4 py-2 text-sm text-brand-text focus:border-brand-primary focus:outline-none"
              />
              <textarea
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
                placeholder="Describe what this dashboard highlights."
                rows={3}
                className="w-full rounded-2xl border border-brand-primary/30 bg-white px-4 py-2 text-sm text-brand-text focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false)
                  setNewTitle('')
                  setNewDescription('')
                }}
                className="rounded-full border border-brand-primary/30 px-4 py-2 text-xs font-semibold text-brand-muted transition hover:border-brand-primary/50 hover:text-brand-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateDashboard}
                className="rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-primary-dark"
              >
                Create dashboard
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="relative flex aspect-square flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-brand-primary/40 bg-white/70 p-6 text-brand-primary shadow transition hover:-translate-y-1 hover:border-brand-primary hover:bg-brand-primary/10 hover:text-brand-primary-dark"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-brand-primary/30 text-3xl font-semibold">
              +
            </span>
            <span className="text-sm font-semibold">Create new dashboard</span>
            <span className="text-xs text-brand-muted">Design layouts, add charts, and collaborate.</span>
          </button>
        )}

        {filteredDashboards.length === 0 && dashboards.length > 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-brand-primary/30 bg-white/70 p-10 text-center">
            <h3 className="text-lg font-semibold text-brand-text">No dashboards match that search</h3>
            <p className="text-sm text-brand-body">Try a different keyword or create something new.</p>
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="rounded-full border border-brand-primary/30 px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/10"
            >
              Clear search
            </button>
          </div>
        )}

        {filteredDashboards.map((dashboard) => (
          <div
            key={dashboard.id}
            className="group relative flex aspect-square flex-col rounded-3xl border border-brand-primary/20 bg-white/80 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex-1">
              <div className="flex h-24 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary/20 via-white to-brand-primary/10 text-brand-primary">
                <span className="text-sm font-semibold uppercase tracking-[0.35em]">Preview</span>
              </div>
              <div className="mt-3 space-y-2">
                <h3 className="text-base font-semibold text-brand-text">{dashboard.title}</h3>
                <p className="line-clamp-2 text-xs text-brand-body">{dashboard.description}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-brand-muted">
                <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-brand-primary">
                  Owner {dashboard.owner}
                </span>
                <span>Updated {dateFormatter.format(new Date(dashboard.updatedAt))}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {dashboard.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-brand-primary/10 px-2 py-1 text-brand-primary">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-brand-primary/40 px-3 py-1 text-xs font-semibold text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/10"
                >
                  Open
                </button>
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-brand-primary/40 px-3 py-1 text-xs font-semibold text-brand-primary/80 transition hover:border-brand-primary hover:bg-brand-primary/10"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(dashboard.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 transition hover:border-red-400 hover:bg-red-100/70"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {dashboards.length === 0 && !isCreating && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-brand-primary/30 bg-white/70 p-10 text-center">
          <h3 className="text-lg font-semibold text-brand-text">No dashboards yet</h3>
          <p className="text-sm text-brand-body">
            Create a dashboard to visualize performance metrics, share insights, and track progress together.
          </p>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
          >
            Create your first dashboard
          </button>
        </div>
      )}
    </div>
  )
}

export default ProjectDashboardsView
