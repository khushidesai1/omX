import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import WorkspaceSwitcher from '../components/WorkspaceSwitcher'
import ProjectCreationModal from '../components/ProjectCreationModal'
import ProjectGrid from '../components/ProjectGrid'
import wordMark from '../assets/name.svg'
import { useAuth } from '../hooks/useAuth'
import type { CreateProjectPayload } from '../types/project'

function Dashboard() {
  const { authState, workspaces, logout, getProjects, createProject } = useAuth()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const currentWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === authState.currentWorkspaceId),
    [workspaces, authState.currentWorkspaceId],
  )

  useEffect(() => {
    if (authState.isAuthenticated && !currentWorkspace) {
      navigate('/workspaces')
    }
  }, [authState.isAuthenticated, currentWorkspace, navigate])

  const projects = currentWorkspace ? getProjects(currentWorkspace.id) : []

  const userDisplayName = useMemo(() => {
    if (!authState.user) {
      return 'Member'
    }
    return [authState.user.firstName, authState.user.lastName].filter(Boolean).join(' ') || authState.user.email
  }, [authState.user])

  const userInitials = useMemo(() => {
    if (!authState.user) {
      return 'U'
    }
    const initials = [authState.user.firstName, authState.user.lastName]
      .filter(Boolean)
      .map((value) => value!.charAt(0).toUpperCase())
    if (initials.length === 0) {
      return authState.user.email.charAt(0).toUpperCase()
    }
    return initials.join('')
  }, [authState.user])

  const openProjectModal = () => {
    setIsModalOpen(true)
  }

  const handleProjectCreation = async (payload: CreateProjectPayload) => {
    if (!currentWorkspace) {
      return
    }
    await createProject(currentWorkspace.id, payload)
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-brand-primary/10 to-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,_rgba(158,184,160,0.25),_transparent_55%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-10 md:px-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center gap-3 text-lg font-semibold text-brand-primary">
            <img src={wordMark} alt="omX" className="h-10 w-auto" />
            <span className="hidden sm:inline">Workspace dashboard</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 md:justify-end">
            <WorkspaceSwitcher
              onWorkspaceChange={() => navigate('/dashboard')}
              onCreateWorkspace={() => navigate('/workspaces')}
              onJoinWorkspace={() => navigate('/workspaces')}
            />
            <div className="flex items-center gap-3 rounded-full border border-brand-primary/20 bg-white/80 px-4 py-2 shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/15 text-sm font-semibold text-brand-primary">
                {userInitials}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-brand-text">{userDisplayName}</p>
                <p className="text-xs text-brand-body">{authState.user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout().catch(() => {})
                }}
                className="rounded-full border border-brand-primary/30 px-3 py-1 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/10"
              >
                Log out
              </button>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-10 pb-12">
          <section className="space-y-4">
            <div>
              <h1 className="text-4xl font-semibold text-brand-text">Projects</h1>
              <p className="mt-2 max-w-2xl text-lg text-brand-body">
                Manage all projects within {currentWorkspace?.name ?? 'your workspace'}. Launch compute, track progress, and keep collaborators aligned.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-brand-body">
                <span className="rounded-full bg-brand-primary/15 px-3 py-1 font-semibold text-brand-primary">
                  {projects.length} active projects
                </span>
                {currentWorkspace?.description && (
                  <span className="rounded-full bg-white/70 px-3 py-1">{currentWorkspace.description}</span>
                )}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-white px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-primary hover:bg-brand-primary/10"
                onClick={openProjectModal}
              >
                <span aria-hidden>＋</span>
                New project
              </button>
            </div>
          </section>

          <section>
            <ProjectGrid projects={projects} onCreateProject={openProjectModal} />
          </section>
        </main>
      </div>

      {isModalOpen && (
        <ProjectCreationModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleProjectCreation}
        />
      )}
    </div>
  )
}

export default Dashboard
