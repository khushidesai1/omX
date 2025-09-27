import { useEffect, useRef, useState } from 'react'

interface WorkspaceDropdownProps {
  workspaceName: string
  onBackToWorkspace: () => void
  onWorkspaceSettings: () => void
  onLogout: () => void
}

function WorkspaceDropdown({
  workspaceName,
  onBackToWorkspace,
  onWorkspaceSettings,
  onLogout,
}: WorkspaceDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleOpen = () => {
    setIsOpen((previous) => !previous)
  }

  const closeAnd = (action: () => void) => () => {
    setIsOpen(false)
    action()
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-3 rounded-full border border-brand-primary/30 bg-white/90 px-4 py-2 text-sm font-semibold text-brand-text shadow transition hover:border-brand-primary/60"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
          <span className="sr-only">Workspace</span>
          <svg
            aria-hidden
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 7.5h15M4.5 12h15M4.5 16.5h15"
            />
          </svg>
        </span>
        <span className="hidden sm:inline">{workspaceName}</span>
        <svg
          aria-hidden
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={`h-4 w-4 text-brand-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 mt-3 w-56 rounded-2xl border border-brand-primary/20 bg-white p-2 text-sm text-brand-body shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={closeAnd(onBackToWorkspace)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-left font-semibold text-brand-text transition hover:bg-brand-primary/10"
          >
            <svg
              aria-hidden
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7 7-7" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12h18"
              />
            </svg>
            Back to workspace
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={closeAnd(onWorkspaceSettings)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-left transition hover:bg-brand-primary/10"
          >
            <svg
              aria-hidden
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
              />
            </svg>
            Workspace settings
          </button>

          <div className="my-1 h-px bg-brand-primary/15" />

          <button
            type="button"
            role="menuitem"
            onClick={closeAnd(onLogout)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-left text-red-600 transition hover:bg-red-100/60"
          >
            <svg
              aria-hidden
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12H9"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19H5a2 2 0 01-2-2V7a2 2 0 012-2h7"
              />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default WorkspaceDropdown
