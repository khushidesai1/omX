import type { ReactNode } from 'react'

import type { Project } from '../../types/project'

interface ProjectMainContentProps {
  project: Project
  workspaceName: string
  children: ReactNode
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function ProjectMainContent({ project, workspaceName, children }: ProjectMainContentProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="rounded-3xl border border-brand-primary/20 bg-white/80 p-6 shadow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-muted">Workspace</p>
            <h2 className="text-lg font-semibold text-brand-text">{workspaceName}</h2>
            <p className="mt-2 max-w-2xl text-sm text-brand-body">
              {project.description || 'Add context so teammates know what this project is focused on.'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right text-xs text-brand-muted">
            <span>Updated {dateFormatter.format(new Date(project.updatedAt))}</span>
            <span>Created {dateFormatter.format(new Date(project.createdAt))}</span>
            {project.projectType && (
              <span className="mt-1 inline-flex items-center gap-2 rounded-full bg-brand-primary/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
                {project.projectType}
              </span>
            )}
          </div>
        </div>
        {project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-brand-body">
            {project.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-brand-primary/10 px-3 py-1">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </section>
      <section className="flex-1 rounded-3xl border border-brand-primary/20 bg-white/90 p-6 shadow-lg">
        {children}
      </section>
    </div>
  )
}

export default ProjectMainContent
