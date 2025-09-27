import { Link } from 'react-router-dom'

import type { Project } from '../types/project'

interface ProjectGridProps {
  projects: Project[]
  onCreateProject: () => void
}

function projectTypeLabel(project: Project) {
  return project.projectType ? project.projectType.toUpperCase() : 'PROJECT'
}

function ProjectGrid({ projects, onCreateProject }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-primary/30 bg-white/80 p-12 text-center shadow">
        <p className="text-lg font-semibold text-brand-text">No projects yet</p>
        <p className="mt-2 max-w-md text-sm text-brand-body">
          Kick off your first analysis or workflow by creating a project. You can add tags and choose a project type to stay organized.
        </p>
        <button
          type="button"
          onClick={onCreateProject}
          className="mt-6 rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          New project
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <Link
          key={project.id}
          to={`/workspace/${project.workspaceId}/project/${project.id}/data`}
          className="group relative block aspect-square overflow-hidden rounded-3xl border border-brand-primary/20 bg-white/95 p-6 text-left shadow transition hover:-translate-y-1 hover:shadow-xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-brand-primary">
            {projectTypeLabel(project)}
          </span>
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 rounded-2xl border border-dashed border-brand-primary/30 bg-brand-primary/5 p-6 text-center text-sm text-brand-body transition group-hover:border-brand-primary/50 group-hover:bg-brand-primary/10">
            <p>{project.description || 'No description provided yet.'}</p>
          </div>
          <div className="absolute inset-x-6 bottom-6">
            <h3 className="text-lg font-semibold text-brand-text">{project.name}</h3>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-brand-body">
              <span className="rounded-full bg-brand-primary/10 px-3 py-1 font-semibold text-brand-primary">
                {project.creatorName}
              </span>
              {project.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-brand-primary/5 px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Link>
      ))}

      <button
        type="button"
        onClick={onCreateProject}
        className="relative flex aspect-square flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-brand-primary/40 bg-white/70 text-brand-primary shadow transition hover:-translate-y-1 hover:border-brand-primary hover:bg-brand-primary/10 hover:text-brand-primary-dark"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-brand-primary/30 text-3xl font-semibold">
          +
        </span>
        <span className="text-sm font-semibold">Add project</span>
      </button>
    </div>
  )
}

export default ProjectGrid
