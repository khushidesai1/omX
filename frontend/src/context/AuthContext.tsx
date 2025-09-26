import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import type { RegisterData, AuthState, User } from '../types/auth'
import type {
  CreateWorkspacePayload,
  JoinWorkspacePayload,
  Workspace,
} from '../types/workspace'
import type { CreateProjectPayload, Project } from '../types/project'

interface AuthContextValue {
  authState: AuthState
  workspaces: Workspace[]
  projectsByWorkspace: Record<string, Project[]>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<void>
  setCurrentWorkspace: (workspaceId: string) => void
  createWorkspace: (
    payload: CreateWorkspacePayload,
  ) => Promise<{ workspace: Workspace; inviteCode: string; accessKey?: string }>
  joinWorkspace: (payload: JoinWorkspacePayload) => Promise<Workspace>
  createProject: (workspaceId: string, payload: CreateProjectPayload) => Promise<Project>
  getProjects: (workspaceId: string) => Project[]
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const nowIso = () => new Date().toISOString()

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `id-${Math.random().toString(36).slice(2, 11)}`
}

const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let index = 0; index < 6; index += 1) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    code += chars[randomIndex]
  }
  return code
}

const mockCatalog: Array<{
  inviteCode: string
  accessKey?: string
  workspace: Workspace
  projects: Project[]
}> = [
  {
    inviteCode: 'AZIZI6',
    workspace: {
      id: 'workspace-azizi',
      name: 'AziziLab Workspace',
      description: 'Joint tumor microenvironment analyses and compute orchestration.',
      ownerId: 'user-azizi',
      inviteCode: 'AZIZI6',
      hasAccessKey: false,
      isPublic: false,
      memberCount: 12,
      role: 'member',
      createdAt: '2023-04-12T15:24:00.000Z',
    },
    projects: [
      {
        id: 'project-stroma',
        name: 'Stroma Atlas Sprint',
        description: 'High dimensional profiling for co-culture experiments.',
        workspaceId: 'workspace-azizi',
        createdBy: 'user-azizi',
        creatorName: 'Sara Azizi',
        projectType: 'codex',
        tags: ['codex', 'atlas'],
        createdAt: '2024-01-06T10:12:00.000Z',
        updatedAt: '2024-02-18T08:45:00.000Z',
      },
      {
        id: 'project-residency',
        name: 'Resident TIL Analysis',
        description: 'Spatial phenotyping of tissue resident lymphocytes.',
        workspaceId: 'workspace-azizi',
        createdBy: 'user-lwei',
        creatorName: 'Lina Wei',
        projectType: 'xenium',
        tags: ['xenium', 'til'],
        createdAt: '2023-11-01T18:33:00.000Z',
        updatedAt: '2024-03-02T14:05:00.000Z',
      },
    ],
  },
  {
    inviteCode: 'GENSYS',
    accessKey: 'SECURE-2024',
    workspace: {
      id: 'workspace-gensys',
      name: 'GenSys Pilot',
      description: 'Multi-institution compute sandbox for pilot deployments.',
      ownerId: 'user-gensys',
      inviteCode: 'GENSYS',
      hasAccessKey: true,
      isPublic: false,
      memberCount: 8,
      role: 'member',
      createdAt: '2024-02-21T09:17:00.000Z',
    },
    projects: [
      {
        id: 'project-runs',
        name: 'Onboarding Benchmarks',
        description: 'GPU scheduling benchmarks for partner organizations.',
        workspaceId: 'workspace-gensys',
        createdBy: 'user-gensys',
        creatorName: 'Nikhil Rao',
        projectType: 'pipeline',
        tags: ['compute', 'benchmark'],
        createdAt: '2024-03-04T12:00:00.000Z',
        updatedAt: '2024-03-22T12:00:00.000Z',
      },
    ],
  },
]

const seededLoginUser = (email: string): User => ({
  id: 'user-seeded',
  email,
  firstName: 'Jordan',
  lastName: 'Hernandez',
  createdAt: '2024-01-01T12:00:00.000Z',
})

function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    currentWorkspaceId: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  })
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [projectsByWorkspace, setProjectsByWorkspace] = useState<Record<string, Project[]>>({})

  const clearError = useCallback(() => {
    setAuthState((previous) => ({ ...previous, error: null }))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    if (!email || !password) {
      setAuthState((previous) => ({
        ...previous,
        error: 'Email and password are required.',
      }))
      return
    }

    setAuthState((previous) => ({ ...previous, isLoading: true, error: null }))

    await new Promise((resolve) => {
      setTimeout(resolve, 350)
    })

    const user = seededLoginUser(email.toLowerCase())

    const enrolledWorkspaces = mockCatalog.map((entry) => ({
      ...entry.workspace,
      role: entry.workspace.role === 'member' ? 'admin' : entry.workspace.role,
    }))

    const projectsSeed = mockCatalog.reduce<Record<string, Project[]>>((accumulator, entry) => {
      accumulator[entry.workspace.id] = entry.projects
      return accumulator
    }, {})

    setWorkspaces(enrolledWorkspaces)
    setProjectsByWorkspace(projectsSeed)
    setAuthState({
      user,
      currentWorkspaceId: enrolledWorkspaces[0]?.id ?? null,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })
  }, [])

  const logout = useCallback(() => {
    setAuthState({
      user: null,
      currentWorkspaceId: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
    setWorkspaces([])
    setProjectsByWorkspace({})
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    if (!data.email || !data.password) {
      setAuthState((previous) => ({
        ...previous,
        error: 'All required fields must be completed.',
      }))
      return
    }

    setAuthState((previous) => ({ ...previous, isLoading: true, error: null }))

    await new Promise((resolve) => {
      setTimeout(resolve, 350)
    })

    const user: User = {
      id: createId(),
      email: data.email.toLowerCase(),
      firstName: data.firstName,
      lastName: data.lastName,
      createdAt: nowIso(),
    }

    setWorkspaces([])
    setProjectsByWorkspace({})
    setAuthState({
      user,
      currentWorkspaceId: null,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })
  }, [])

  const setCurrentWorkspace = useCallback((workspaceId: string) => {
    setAuthState((previous) => ({
      ...previous,
      currentWorkspaceId: workspaceId,
    }))
  }, [])

  const createWorkspace = useCallback(
    async (payload: CreateWorkspacePayload) => {
      if (!authState.user) {
        throw new Error('You need to be logged in to create a workspace.')
      }

      if (!payload.name.trim()) {
        throw new Error('Workspace name is required.')
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 250)
      })

      const workspace: Workspace = {
        id: createId(),
        name: payload.name.trim(),
        description: payload.description?.trim(),
        ownerId: authState.user.id,
        inviteCode: generateInviteCode(),
        hasAccessKey: Boolean(payload.accessKey && payload.accessKey.trim().length > 0),
        isPublic: false,
        memberCount: 1,
        role: 'owner',
        createdAt: nowIso(),
      }

      setWorkspaces((previous) => [...previous, workspace])
      setProjectsByWorkspace((previous) => ({
        ...previous,
        [workspace.id]: [],
      }))
      setAuthState((previous) => ({
        ...previous,
        currentWorkspaceId: workspace.id,
      }))

      return {
        workspace,
        inviteCode: workspace.inviteCode,
        accessKey: payload.accessKey?.trim() || undefined,
      }
    },
    [authState.user],
  )

  const joinWorkspace = useCallback(async (payload: JoinWorkspacePayload) => {
    if (!authState.user) {
      throw new Error('You need to be logged in to join a workspace.')
    }

    const inviteCode = payload.inviteCode.trim().toUpperCase()
    if (!inviteCode) {
      throw new Error('Invite code is required.')
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 250)
    })

    const catalogEntry = mockCatalog.find((entry) => entry.inviteCode === inviteCode)
    if (!catalogEntry) {
      throw new Error('No workspace found for that invite code.')
    }

    if (catalogEntry.accessKey) {
      if (!payload.accessKey?.trim()) {
        throw new Error('This workspace requires an access key.')
      }
      if (payload.accessKey.trim() !== catalogEntry.accessKey) {
        throw new Error('Access key is incorrect.')
      }
    }

    const alreadyJoined = workspaces.find((workspace) => workspace.id === catalogEntry.workspace.id)
    if (alreadyJoined) {
      setAuthState((previous) => ({ ...previous, currentWorkspaceId: alreadyJoined.id }))
      return alreadyJoined
    }

    const newWorkspace: Workspace = {
      ...catalogEntry.workspace,
      role: 'member',
      memberCount: catalogEntry.workspace.memberCount + 1,
    }

    setWorkspaces((previous) => [...previous, newWorkspace])
    setProjectsByWorkspace((previous) => ({
      ...previous,
      [newWorkspace.id]: catalogEntry.projects,
    }))
    setAuthState((previous) => ({
      ...previous,
      currentWorkspaceId: newWorkspace.id,
    }))

    return newWorkspace
  }, [authState.user, workspaces])

  const createProject = useCallback(
    async (workspaceId: string, payload: CreateProjectPayload) => {
      if (!authState.user) {
        throw new Error('You need to be logged in to create a project.')
      }

      if (!payload.name.trim()) {
        throw new Error('Project name is required.')
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 250)
      })

      const project: Project = {
        id: createId(),
        name: payload.name.trim(),
        description: payload.description?.trim(),
        workspaceId,
        createdBy: authState.user.id,
        creatorName: [authState.user.firstName, authState.user.lastName].filter(Boolean).join(' ') || authState.user.email,
        projectType: payload.projectType?.trim(),
        tags: payload.tags?.filter((tag) => tag.trim().length > 0) || [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }

      setProjectsByWorkspace((previous) => ({
        ...previous,
        [workspaceId]: [...(previous[workspaceId] ?? []), project],
      }))

      return project
    },
    [authState.user],
  )

  const getProjects = useCallback(
    (workspaceId: string) => projectsByWorkspace[workspaceId] ?? [],
    [projectsByWorkspace],
  )

  const value = useMemo(
    () => ({
      authState,
      workspaces,
      projectsByWorkspace,
      login,
      logout,
      register,
      setCurrentWorkspace,
      createWorkspace,
      joinWorkspace,
      createProject,
      getProjects,
      clearError,
    }),
    [
      authState,
      workspaces,
      projectsByWorkspace,
      login,
      logout,
      register,
      setCurrentWorkspace,
      createWorkspace,
      joinWorkspace,
      createProject,
      getProjects,
      clearError,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

export { AuthProvider, useAuthContext }
