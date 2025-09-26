import { useState } from 'react'
import type { FormEvent } from 'react'

import type { CreateProjectPayload } from '../types/project'

interface ProjectCreationModalProps {
  onClose: () => void
  onCreate: (payload: CreateProjectPayload) => Promise<void>
}

function ProjectCreationModal({ onClose, onCreate }: ProjectCreationModalProps) {
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    projectType: '',
    tags: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!formState.name.trim()) {
      setError('Project name is required.')
      return
    }

    setIsSubmitting(true)
    try {
      await onCreate({
        name: formState.name,
        description: formState.description,
        projectType: formState.projectType,
        tags: formState.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
      })
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not create project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-text/40 px-4 py-6">
      <div className="w-full max-w-lg rounded-3xl border border-brand-primary/30 bg-white/95 p-8 shadow-2xl backdrop-blur">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-brand-text">Create new project</h2>
            <p className="mt-1 text-sm text-brand-body">
              Name your project and add optional context to help teammates discover it quickly.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-primary/30 p-2 text-brand-primary transition hover:bg-brand-primary/10"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="project-name" className="text-sm font-semibold text-brand-text">
              Project name
            </label>
            <input
              id="project-name"
              value={formState.name}
              onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
              placeholder="Example: Pilot spatial transcriptomics"
              required
              className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="project-description" className="text-sm font-semibold text-brand-text">
              Description (optional)
            </label>
            <textarea
              id="project-description"
              value={formState.description}
              onChange={(event) => setFormState((previous) => ({ ...previous, description: event.target.value }))}
              placeholder="Outline the goals or datasets for this project"
              rows={3}
              className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="project-type" className="text-sm font-semibold text-brand-text">
                Project type (optional)
              </label>
              <input
                id="project-type"
                value={formState.projectType}
                onChange={(event) => setFormState((previous) => ({ ...previous, projectType: event.target.value }))}
                placeholder="ex: xenium, codex"
                className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="project-tags" className="text-sm font-semibold text-brand-text">
                Tags (comma separated)
              </label>
              <input
                id="project-tags"
                value={formState.tags}
                onChange={(event) => setFormState((previous) => ({ ...previous, tags: event.target.value }))}
                placeholder="atlas, pilot, oncology"
                className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
          </div>
          {error && <p className="text-sm text-amber-600">{error}</p>}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-brand-primary/30 px-5 py-2 text-sm font-semibold text-brand-text transition hover:bg-brand-primary/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectCreationModal
