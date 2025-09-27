import { NavLink } from 'react-router-dom'

import dataTabIcon from '../../assets/project-data-icon.png'
import dashboardTabIcon from '../../assets/project-dashboard-icon.png'

interface ProjectSidebarProps {
  basePath: string
  projectName: string
}

const tabs = [
  {
    key: 'data',
    label: 'Data',
    icon: dataTabIcon,
  },
  {
    key: 'dashboards',
    label: 'Dashboards',
    icon: dashboardTabIcon,
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
            {({ isActive }) => (
              <img
                src={tab.icon}
                alt=""
                className={`h-8 w-8 object-contain ${
                  isActive ? '' : 'opacity-80 group-hover:opacity-100'
                }`}
              />
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default ProjectSidebar
