import { useMemo } from 'react'
import { Navigate, Outlet, useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import ProjectTopNavigation from './ProjectTopNavigation'
import ProjectSidebar from './ProjectSidebar'
import ProjectMainContent from './ProjectMainContent'

function ProjectDetailLayout() {
  const { workspaceId, projectId } = useParams()
  const navigate = useNavigate()
  const { authState, projectsByWorkspace, workspaces, logout } = useAuth()

  const project = useMemo(() => {
    if (!workspaceId || !projectId) {
      return undefined
    }
    const projects = projectsByWorkspace[workspaceId]
    return projects?.find((candidate) => candidate.id === projectId)
  }, [projectId, projectsByWorkspace, workspaceId])

  const workspace = useMemo(
    () => workspaces.find((candidate) => candidate.id === workspaceId),
    [workspaces, workspaceId],
  )

  const userDisplayName = useMemo(() => {
    if (!authState.user) {
      return 'Member'
    }
    const fullName = [authState.user.firstName, authState.user.lastName]
      .filter((value): value is string => Boolean(value))
      .join(' ')
    return fullName || authState.user.email
  }, [authState.user])

  const userInitials = useMemo(() => {
    if (!authState.user) {
      return 'U'
    }
    const initials = [authState.user.firstName, authState.user.lastName]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.charAt(0).toUpperCase())
    if (initials.length === 0) {
      return authState.user.email.charAt(0).toUpperCase()
    }
    return initials.join('')
  }, [authState.user])

  if (authState.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-primary/5 text-brand-text">
        Loading project…
      </div>
    )
  }

  if (!workspaceId || !projectId) {
    return <Navigate to="/dashboard" replace />
  }

  if (!project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-brand-primary/5 text-center">
        <div className="max-w-md space-y-4 rounded-3xl bg-white p-10 shadow-xl">
          <h1 className="text-2xl font-semibold text-brand-text">Project not found</h1>
          <p className="text-sm text-brand-body">
            We could not locate that project in the current workspace. It may have been renamed or removed.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
          >
            Return to workspace dashboard
          </button>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/auth/sign-in')
    } catch (error) {
      console.error(error)
    }
  }

  const basePath = `/workspace/${workspaceId}/project/${projectId}`

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-brand-primary/10 to-white">
      <ProjectSidebar basePath={basePath} projectName={project.name} />
      <div className="flex flex-1 flex-col">
        <ProjectTopNavigation
          projectName={project.name}
          workspaceName={workspace?.name ?? 'Workspace'}
          userDisplayName={userDisplayName}
          userEmail={authState.user?.email ?? ''}
          userInitials={userInitials}
          onBackToWorkspace={() => navigate('/dashboard')}
          onWorkspaceSettings={() => navigate('/workspaces')}
          onLogout={handleLogout}
        />
        <div className="flex-1 overflow-y-auto px-6 pb-10 pt-6 sm:px-10">
          <ProjectMainContent project={project} workspaceName={workspace?.name ?? 'Workspace'}>
            <Outlet />
          </ProjectMainContent>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetailLayout
