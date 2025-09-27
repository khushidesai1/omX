import type { ReactNode } from 'react'

interface ProjectMainContentProps {
  children: ReactNode
}

function ProjectMainContent({ children }: ProjectMainContentProps) {
  return <div className="flex h-full w-full flex-col gap-6">{children}</div>
}

export default ProjectMainContent
