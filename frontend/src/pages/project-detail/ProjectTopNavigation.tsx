import WorkspaceDropdown from './WorkspaceDropdown'

interface ProjectTopNavigationProps {
  projectName: string
  workspaceName: string
  userDisplayName: string
  userEmail: string
  userInitials: string
  onBackToWorkspace: () => void
  onWorkspaceSettings: () => void
  onLogout: () => void
}

function ProjectTopNavigation({
  projectName,
  workspaceName,
  userDisplayName,
  userEmail,
  userInitials,
  onBackToWorkspace,
  onWorkspaceSettings,
  onLogout,
}: ProjectTopNavigationProps) {
  return (
    <header className="flex items-center gap-4 border-b border-brand-primary/20 bg-white/80 px-6 py-4 backdrop-blur sm:px-10">
      <div className="flex flex-1 justify-start">
        <WorkspaceDropdown
          workspaceName={workspaceName}
          onBackToWorkspace={onBackToWorkspace}
          onWorkspaceSettings={onWorkspaceSettings}
          onLogout={onLogout}
        />
      </div>

      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-muted">Project</p>
        <h1 className="text-xl font-semibold text-brand-text sm:text-2xl">{projectName}</h1>
      </div>

      <div className="flex flex-1 justify-end">
        <div className="flex items-center gap-3 rounded-full border border-brand-primary/20 bg-white/70 px-4 py-2 shadow">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/15 text-sm font-semibold text-brand-primary">
            {userInitials}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-brand-text">{userDisplayName}</p>
            {userEmail && <p className="text-xs text-brand-body">{userEmail}</p>}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-brand-primary/30 px-3 py-1 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/10"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}

export default ProjectTopNavigation
