import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import type { UpdateWorkspacePayload, WorkspaceDetail } from '../types/workspace'

function WorkspaceSettings() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
 const navigate = useNavigate()
  const [previousPath, setPreviousPath] = useState<string | null>(null)
  const {
    fetchWorkspaceDetail,
    updateWorkspace,
    deleteWorkspace,
    authState,
  } = useAuth()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<WorkspaceDetail | null>(null)

  const [formState, setFormState] = useState({
    name: '',
    slug: '',
    description: '',
    accessKey: '',
    isPublic: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = useMemo(
    () => detail?.ownerId === authState.user?.id,
    [detail, authState.user?.id],
  )

  useEffect(() => {
    setPreviousPath((state) => state ?? (document.referrer || null))

    if (!workspaceId) {
      return
    }

    setIsLoading(true)
    setError(null)

    fetchWorkspaceDetail(workspaceId)
      .then((workspace) => {
       setDetail(workspace)
       setFormState({
         name: workspace.name,
         slug: workspace.slug,
          description: workspace.description ?? '',
          accessKey: workspace.accessKey ?? '',
          isPublic: workspace.isPublic,
        })
      })
      .catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load workspace settings.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [fetchWorkspaceDetail, workspaceId])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = event.target
    if (target instanceof HTMLInputElement) {
      const nextValue = target.type === 'checkbox' ? target.checked : target.value
      setFormState((previous) => ({
        ...previous,
        [target.name]: nextValue,
      }))
    } else {
      setFormState((previous) => ({
        ...previous,
        [target.name]: target.value,
      }))
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!workspaceId) {
      return
    }

    if (!isOwner) {
      setSaveMessage('Only workspace owners can update settings.')
      return
    }

    setIsSaving(true)
    setSaveMessage(null)
    setError(null)

    const payload: UpdateWorkspacePayload = {
      name: formState.name,
      description: formState.description || undefined,
      slug: formState.slug,
      accessKey: formState.accessKey,
      isPublic: formState.isPublic,
    }

    try {
      const updated = await updateWorkspace(workspaceId, payload)
      setSaveMessage('Workspace settings saved.')
      setDetail((previous) =>
        previous
          ? {
              ...previous,
              ...updated,
              accessKey: payload.accessKey ?? previous.accessKey,
              members: previous.members,
              projectCount: previous.projectCount,
            }
          : null,
      )
      setFormState((previous) => ({
        ...previous,
        accessKey: payload.accessKey ?? '',
      }))
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to save workspace settings.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!workspaceId || !isOwner) {
      return
    }

    const confirmation = window.confirm(
      'Are you sure you want to delete this workspace? This action cannot be undone.',
    )
    if (!confirmation) {
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteWorkspace(workspaceId)
      navigate('/dashboard')
    } catch (deleteErr) {
      setDeleteError(deleteErr instanceof Error ? deleteErr.message : 'Unable to delete workspace.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-primary/5 text-brand-text">
        Loading workspace settings…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-primary/5">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center text-brand-body shadow-xl">
          <p className="text-lg font-semibold text-brand-text">Unable to load workspace</p>
          <p className="mt-2 text-sm">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-6 rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
          >
            Return to dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!detail) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-brand-primary/10 to-white py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-brand-text">Workspace settings</h1>
            <p className="text-sm text-brand-body">
              Manage workspace metadata, review member access, and keep your collaboration organized.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (previousPath) {
                window.location.href = previousPath
              } else if (history.length > 1) {
                navigate(-1)
              } else {
                navigate('/dashboard')
              }
            }}
            className="inline-flex items-center gap-2 self-start rounded-full border border-brand-primary/30 bg-white px-4 py-2 text-sm font-semibold text-brand-muted transition hover:border-brand-primary/60 hover:text-brand-primary"
          >
            Exit
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-3xl border border-brand-primary/20 bg-white/90 p-6 shadow"
        >
          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-muted">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formState.name}
              onChange={handleInputChange}
              disabled={!isOwner}
              className="rounded-2xl border border-brand-primary/30 bg-white px-4 py-2 text-sm text-brand-text focus:border-brand-primary focus:outline-none disabled:bg-brand-primary/10 disabled:text-brand-muted"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-muted">
              Workspace ID (slug)
            </label>
            <input
              type="text"
              name="slug"
              value={formState.slug}
              onChange={handleInputChange}
              disabled={!isOwner}
              className="rounded-2xl border border-brand-primary/30 bg-white px-4 py-2 text-sm text-brand-text focus:border-brand-primary focus:outline-none disabled:bg-brand-primary/10 disabled:text-brand-muted"
              placeholder="workspace-id"
            />
            <p className="text-xs text-brand-muted">
              Used in URLs and invite links. Lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-muted">
              Description
            </label>
            <textarea
              name="description"
              value={formState.description}
              onChange={handleInputChange}
              disabled={!isOwner}
              rows={4}
              className="rounded-2xl border border-brand-primary/30 bg-white px-4 py-2 text-sm text-brand-text focus:border-brand-primary focus:outline-none disabled:bg-brand-primary/10 disabled:text-brand-muted"
              placeholder="Describe the purpose or scope of this workspace."
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-muted">
              Access key
            </label>
            <input
              type="text"
              name="accessKey"
              value={formState.accessKey}
              onChange={handleInputChange}
              disabled={!isOwner}
              className="rounded-2xl border border-brand-primary/30 bg-white px-4 py-2 text-sm text-brand-text focus:border-brand-primary focus:outline-none disabled:bg-brand-primary/10 disabled:text-brand-muted"
              placeholder="Optional access key for invitation-only access"
            />
            {detail.hasAccessKey && !formState.accessKey && (
              <p className="text-xs text-brand-muted">Clearing this field removes the current access key.</p>
            )}
          </div>

          <label className="inline-flex items-center gap-3 text-sm text-brand-body">
            <input
              type="checkbox"
              name="isPublic"
              checked={formState.isPublic}
              onChange={handleInputChange}
              disabled={!isOwner}
              className="h-4 w-4 rounded border-brand-primary/40 text-brand-primary focus:ring-brand-primary"
            />
            <span>Allow members to discover this workspace without an invite</span>
          </label>

          {saveMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              {saveMessage}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving || !isOwner}
              className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:bg-brand-primary/40"
            >
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>

        <section className="rounded-3xl border border-brand-primary/20 bg-white/90 p-6 shadow">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-brand-text">Members</h2>
              <p className="text-sm text-brand-body">{detail.members.length} members in this workspace.</p>
            </div>
          </header>
          <div className="mt-4 divide-y divide-brand-primary/10">
            {detail.members.map((member) => (
              <div key={member.userId} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-text">
                    {member.firstName || member.lastName
                      ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim()
                      : member.email}
                  </p>
                  <p className="text-xs text-brand-muted">{member.email}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-brand-muted">
                  <span className="rounded-full bg-brand-primary/10 px-3 py-1 font-semibold uppercase tracking-[0.2em] text-brand-primary">
                    {member.role}
                  </span>
                  <span>Joined {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(member.joinedAt))}</span>
                </div>
              </div>
            ))}
            {detail.members.length === 0 && (
              <div className="py-4 text-sm text-brand-muted">No members yet.</div>
            )}
          </div>
        </section>

        {isOwner && (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow">
            <h2 className="text-xl font-semibold">Danger zone</h2>
            <p className="mt-2 text-sm">
              Deleting this workspace permanently removes all associated projects and data links. This action cannot
              be undone.
            </p>
            {deleteError && (
              <div className="mt-3 rounded-2xl border border-red-300 bg-white/70 px-4 py-2 text-sm text-red-600">
                {deleteError}
              </div>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-400 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? 'Deleting…' : 'Delete workspace'}
            </button>
          </section>
        )}
      </div>
    </div>
  )
}

export default WorkspaceSettings
