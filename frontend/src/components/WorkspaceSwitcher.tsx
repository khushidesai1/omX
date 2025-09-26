import { useState } from 'react'

import { useAuth } from '../hooks/useAuth'

interface WorkspaceSwitcherProps {
  onCreateWorkspace?: () => void
  onJoinWorkspace?: () => void
  onWorkspaceChange?: (workspaceId: string) => void
}

function WorkspaceSwitcher({
  onCreateWorkspace,
  onJoinWorkspace,
  onWorkspaceChange,
}: WorkspaceSwitcherProps) {
  const { authState, workspaces, setCurrentWorkspace } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const currentWorkspace = workspaces.find(
    (workspace) => workspace.id === authState.currentWorkspaceId,
  )

  const handleSelect = (workspaceId: string) => {
    setCurrentWorkspace(workspaceId)
    setIsOpen(false)
    onWorkspaceChange?.(workspaceId)
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-white/90 px-5 py-2 text-sm font-semibold text-brand-text shadow transition hover:border-brand-primary/60 hover:bg-white"
      >
        <span>{currentWorkspace?.name ?? 'Select workspace'}</span>
        <svg
          className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M5 7l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-20 w-72 rounded-2xl border border-brand-primary/20 bg-white/95 p-3 shadow-xl backdrop-blur">
          <p className="px-2 text-xs font-semibold uppercase tracking-[0.35em] text-brand-primary/80">
            Workspaces
          </p>
          <div className="mt-2 space-y-2">
            {workspaces.length === 0 && (
              <p className="px-2 py-2 text-sm text-brand-body">No workspaces yet.</p>
            )}
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                onClick={() => handleSelect(workspace.id)}
                className={`flex w-full flex-col rounded-xl px-4 py-3 text-left transition hover:bg-brand-primary/10 ${
                  workspace.id === authState.currentWorkspaceId ? 'bg-brand-primary/10 text-brand-primary' : 'text-brand-text'
                }`}
              >
                <span className="text-sm font-semibold">{workspace.name}</span>
                <span className="text-xs text-brand-body">Role: {workspace.role}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-2 border-t border-brand-primary/10 pt-3">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onCreateWorkspace?.()
              }}
              className="flex w-full items-center justify-between rounded-xl border border-dashed border-brand-primary/40 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/10"
            >
              Create workspace
              <span aria-hidden>+</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onJoinWorkspace?.()
              }}
              className="flex w-full items-center justify-between rounded-xl border border-brand-primary/20 px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-primary hover:bg-brand-primary/10"
            >
              Join workspace
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M10 4v12m6-6H4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkspaceSwitcher
