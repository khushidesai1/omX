import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import wordMark from '../assets/name.svg'
import { useAuth } from '../hooks/useAuth'

interface CreateFormState {
  name: string
  description: string
  accessKey: string
  slug: string
}

interface JoinFormState {
  workspaceId: string
  accessKey: string
}

function WorkspaceSelector() {
  const { authState, workspaces, setCurrentWorkspace, createWorkspace, joinWorkspace, logout } = useAuth()
  const navigate = useNavigate()

  const [createForm, setCreateForm] = useState<CreateFormState>({
    name: '',
    description: '',
    accessKey: '',
    slug: '',
  })
  const [joinForm, setJoinForm] = useState<JoinFormState>({ workspaceId: '', accessKey: '' })
  const [createError, setCreateError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<{ workspaceId: string; accessKey?: string } | null>(null)
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    if (!authState.isAuthenticated) {
      navigate('/auth/sign-in')
    }
  }, [authState.isAuthenticated, navigate])

  const hasWorkspaces = workspaces.length > 0

  const userInitials = useMemo(() => {
    if (!authState.user) {
      return '?' 
    }
    const initials = [authState.user.firstName, authState.user.lastName]
      .filter(Boolean)
      .map((value) => value!.charAt(0).toUpperCase())
    if (initials.length === 0) {
      return authState.user.email.charAt(0).toUpperCase()
    }
    return initials.join('')
  }, [authState.user])

  const handleSelectWorkspace = (workspaceId: string) => {
    setCurrentWorkspace(workspaceId)
    navigate('/dashboard')
  }

  const handleCreateWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError(null)
    setCreateSuccess(null)
    setIsCreating(true)
    try {
      const response = await createWorkspace({
        name: createForm.name,
        description: createForm.description,
        accessKey: createForm.accessKey,
        slug: createForm.slug,
      })
      setCreateSuccess({ workspaceId: response.workspace.slug, accessKey: response.accessKey })
      setCreateForm({ name: '', description: '', accessKey: '', slug: '' })
      setTimeout(() => {
        navigate('/dashboard')
      }, 800)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Unable to create workspace.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setJoinError(null)
    setJoinSuccess(null)
    setIsJoining(true)
    try {
      const workspace = await joinWorkspace({
        workspaceId: joinForm.workspaceId,
        accessKey: joinForm.accessKey,
      })
      setJoinSuccess(`Joined ${workspace.name} (ID: ${workspace.slug})`)
      setJoinForm({ workspaceId: '', accessKey: '' })
      setTimeout(() => {
        navigate('/dashboard')
      }, 650)
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Unable to join workspace.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-brand-primary/10 to-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(158,184,160,0.25),_transparent_55%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 md:px-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-3 text-lg font-semibold text-brand-primary">
            <img src={wordMark} alt="omX" className="h-10 w-auto" />
            <span className="hidden sm:inline">Return to home</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary md:inline-flex">
              {authState.user?.firstName || 'New'} {authState.user?.lastName || 'member'}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/15 text-sm font-semibold text-brand-primary">
              {userInitials}
            </div>
            <button
              type="button"
              onClick={() => {
                logout().catch(() => {})
              }}
              className="rounded-full border border-brand-primary/40 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/10"
            >
              Log out
            </button>
          </div>
        </header>

        {hasWorkspaces && (
          <section className="rounded-3xl border border-brand-primary/20 bg-white/90 p-6 shadow-xl backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-brand-text">Your workspaces</h2>
                <p className="text-sm text-brand-body">Select a workspace to continue to your dashboard.</p>
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-primary/80">
                {workspaces.length.toString().padStart(2, '0')} available
              </p>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => handleSelectWorkspace(workspace.id)}
                  className="group flex w-full flex-col rounded-2xl border border-brand-primary/20 bg-white/95 p-5 text-left shadow transition hover:-translate-y-1 hover:border-brand-primary/40 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.4em] text-brand-primary/60">{workspace.role}</span>
                    <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
                      {workspace.memberCount} members
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-brand-text">{workspace.name}</h3>
                  {workspace.description && (
                    <p className="mt-2 text-sm text-brand-body">{workspace.description}</p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary">
                    Enter workspace
                    <svg
                      className="h-4 w-4 transition group-hover:translate-x-1"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7 4l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <main className="flex flex-1 items-center">
          <div className="w-full rounded-3xl border border-brand-primary/20 bg-white/95 p-8 shadow-2xl backdrop-blur md:p-12">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold text-brand-text">Create or join a workspace</h1>
              <p className="mt-3 text-brand-body">
                Create a new workspace or join an existing workspace using its workspace ID and access key.
              </p>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <form className="space-y-5" onSubmit={handleCreateWorkspace}>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-primary/80">
                    Create workspace
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-brand-text">Launch a fresh workspace</h2>
                  <p className="mt-1 text-sm text-brand-body">
                    Workspace name is required. Optionally reserve a workspace ID (lowercase, numbers, and dashes) for teammates to join and add an access key for extra control.
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="workspace-name" className="text-sm font-semibold text-brand-text">
                    Workspace name
                  </label>
                  <input
                    id="workspace-name"
                    value={createForm.name}
                    onChange={(event) => {
                      setCreateForm((previous) => ({ ...previous, name: event.target.value }))
                      setCreateError(null)
                      setCreateSuccess(null)
                    }}
                    required
                    placeholder="AziziLab Workspace"
                    className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="workspace-slug" className="text-sm font-semibold text-brand-text">
                    Workspace ID (optional)
                  </label>
                  <input
                    id="workspace-slug"
                    value={createForm.slug}
                    onChange={(event) => {
                      const value = event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
                      setCreateForm((previous) => ({ ...previous, slug: value }))
                      setCreateError(null)
                      setCreateSuccess(null)
                    }}
                    placeholder="omx-shared-lab"
                    className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                  />
                  <p className="text-xs text-brand-muted">Use lowercase letters, numbers, and dashes. Leave blank to auto-generate.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="workspace-description" className="text-sm font-semibold text-brand-text">
                    Description (optional)
                  </label>
                  <textarea
                    id="workspace-description"
                    value={createForm.description}
                    onChange={(event) => {
                      setCreateForm((previous) => ({ ...previous, description: event.target.value }))
                      setCreateError(null)
                      setCreateSuccess(null)
                    }}
                    placeholder="Describe what your workspace is for"
                    rows={3}
                    className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="workspace-access-key" className="text-sm font-semibold text-brand-text">
                    Access key (optional)
                  </label>
                  <input
                    id="workspace-access-key"
                    value={createForm.accessKey}
                    onChange={(event) => {
                      setCreateForm((previous) => ({ ...previous, accessKey: event.target.value }))
                      setCreateError(null)
                      setCreateSuccess(null)
                    }}
                    placeholder="Example: SECURE-2024"
                    className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
                {createError && <p className="text-sm text-amber-600">{createError}</p>}
                {createSuccess && (
                  <div className="space-y-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <p className="font-semibold">Workspace created</p>
                    <p>Workspace ID: {createSuccess.workspaceId}</p>
                    {createSuccess.accessKey && <p>Access key: {createSuccess.accessKey}</p>}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? 'Creating workspace...' : 'Create workspace'}
                </button>
              </form>

              <form className="space-y-5" onSubmit={handleJoinWorkspace}>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-primary/80">
                    Join workspace
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-brand-text">Use an invite code</h2>
                  <p className="mt-1 text-sm text-brand-body">
                    Enter the invite code shared with you. If an access key is required, include it below.
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="invite-code" className="text-sm font-semibold text-brand-text">
                    Workspace ID
                  </label>
                  <input
                    id="invite-code"
                    value={joinForm.workspaceId}
                    onChange={(event) => {
                      const value = event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
                      setJoinForm((previous) => ({ ...previous, workspaceId: value }))
                      setJoinError(null)
                      setJoinSuccess(null)
                    }}
                    placeholder="Example: omx-shared-lab"
                    required
                    className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="join-access-key" className="text-sm font-semibold text-brand-text">
                    Access key (if required)
                  </label>
                  <input
                    id="join-access-key"
                    value={joinForm.accessKey}
                    onChange={(event) => {
                      setJoinForm((previous) => ({ ...previous, accessKey: event.target.value }))
                      setJoinError(null)
                      setJoinSuccess(null)
                    }}
                    placeholder="Provided by workspace owner"
                    className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
                {joinError && <p className="text-sm text-amber-600">{joinError}</p>}
                {joinSuccess && (
                  <div className="rounded-2xl border border-brand-primary/30 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary">
                    <p className="font-semibold">{joinSuccess}</p>
                    <p>Redirecting to dashboard…</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full rounded-full border border-brand-primary bg-white px-6 py-3 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isJoining ? 'Joining workspace...' : 'Join workspace'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default WorkspaceSelector
