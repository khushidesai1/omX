import { NavLink } from 'react-router-dom'

interface ProjectSidebarProps {
  basePath: string
  projectName: string
}

const tabs = [
  {
    key: 'data',
    label: 'Data',
    icon: (
      <svg
        aria-hidden
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <ellipse cx="12" cy="6" rx="6" ry="2.5" />
        <path d="M6 6v12c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V6" />
      </svg>
    ),
  },
  {
    key: 'dashboards',
    label: 'Dashboards',
    icon: (
      <svg
        aria-hidden
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 4h7v7H4z" />
        <path d="M13 4h7v4h-7z" />
        <path d="M13 10h7v10h-7z" />
        <path d="M4 13h7v7H4z" />
      </svg>
    ),
  },
]

function ProjectSidebar({ basePath, projectName }: ProjectSidebarProps) {
  const projectInitials = projectName
    .split(' ')
    .filter((value) => value.length > 0)
    .slice(0, 2)
    .map((value) => value.charAt(0).toUpperCase())
    .join('') || 'P'

  return (
    <aside className="flex w-20 flex-col items-center gap-6 border-r border-brand-primary/20 bg-white/70 py-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-primary/20 bg-brand-primary/10 text-brand-primary">
        <span className="text-sm font-semibold">{projectInitials}</span>
      </div>
      <nav className="flex flex-1 flex-col items-center gap-4">
        {tabs.map((tab) => (
          <NavLink
            key={tab.key}
            to={`${basePath}/${tab.key}`}
            aria-label={tab.label}
            className={({ isActive }) =>
              `group flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
                isActive
                  ? 'border-brand-primary bg-brand-primary/15 text-brand-primary'
                  : 'border-transparent text-brand-muted hover:border-brand-primary/30 hover:text-brand-primary'
              }`
            }
          >
            {tab.icon}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default ProjectSidebar
