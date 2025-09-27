import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<void>
  setCurrentWorkspace: (workspaceId: string) => void
  createWorkspace: (
    payload: CreateWorkspacePayload,
  ) => Promise<{ workspace: Workspace; accessKey?: string }>
  joinWorkspace: (payload: JoinWorkspacePayload) => Promise<Workspace>
  createProject: (workspaceId: string, payload: CreateProjectPayload) => Promise<Project>
  getProjects: (workspaceId: string) => Project[]
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const ACCESS_TOKEN_KEY = 'access_token'
const apiBaseUrl: string | undefined = import.meta.env.VITE_API_URL

const ensureApiBaseUrl = () => {
  if (!apiBaseUrl) {
    throw new Error('API base URL is not configured.')
  }
}

const mapUser = (payload: any): User => ({
  id: payload.id,
  email: payload.email,
  firstName: payload.first_name ?? undefined,
  lastName: payload.last_name ?? undefined,
  createdAt: payload.created_at,
})

const mapWorkspace = (payload: any): Workspace => ({
  id: payload.id,
  name: payload.name,
  description: payload.description ?? undefined,
  ownerId: payload.owner_id,
  slug: payload.slug,
  hasAccessKey: payload.has_access_key,
  isPublic: payload.is_public,
  memberCount: payload.member_count,
  role: payload.role,
  createdAt: payload.created_at,
})

const mapProject = (payload: any): Project => ({
  id: payload.id,
  name: payload.name,
  description: payload.description ?? undefined,
  workspaceId: payload.workspace_id,
  createdBy: payload.created_by,
  creatorName: payload.creator_name,
  projectType: payload.project_type ?? undefined,
  tags: payload.tags ?? [],
  createdAt: payload.created_at,
  updatedAt: payload.updated_at,
})

const parseErrorMessage = async (response: Response) => {
  try {
    const data = await response.json()
    if (!data) {
      return 'Unexpected error occurred.'
    }

    if (typeof data === 'string') {
      return data
    }

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item: any) => (typeof item === 'string' ? item : item?.msg))
        .filter(Boolean)
        .join(', ')
    }

    if (typeof data.detail === 'string') {
      return data.detail
    }

    if (typeof data.message === 'string') {
      return data.message
    }

    return 'Unexpected error occurred.'
  } catch (error) {
    return error instanceof Error ? error.message : 'Unexpected error occurred.'
  }
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    currentWorkspaceId: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [projectsByWorkspace, setProjectsByWorkspace] = useState<Record<string, Project[]>>({})

  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
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

  const authorizedFetch = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      ensureApiBaseUrl()
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        throw new Error('Not authenticated.')
      }

      const headers = new Headers(options.headers ?? undefined)
      if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
      headers.set('Authorization', `Bearer ${token}`)

      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      if (response.status === 401) {
        clearSession()
        throw new Error('Session expired. Please sign in again.')
      }

      if (!response.ok) {
        const message = await parseErrorMessage(response)
        throw new Error(message)
      }

      return response
    },
    [clearSession],
  )

  const fetchProjectsForWorkspace = useCallback(
    async (workspaceId: string) => {
      const response = await authorizedFetch(`/workspaces/${workspaceId}/projects`)
      const data = await response.json()
      return (data.projects ?? []).map(mapProject)
    },
    [authorizedFetch],
  )

  const fetchWorkspacesAndProjects = useCallback(async () => {
    const response = await authorizedFetch('/workspaces')
    const data = await response.json()

    const mappedWorkspaces: Workspace[] = (data.workspaces ?? []).map(mapWorkspace)
    setWorkspaces(mappedWorkspaces)

    const projectMap: Record<string, Project[]> = {}
    for (const workspace of mappedWorkspaces) {
      projectMap[workspace.id] = await fetchProjectsForWorkspace(workspace.id)
    }

    setProjectsByWorkspace(projectMap)
    return mappedWorkspaces
  }, [authorizedFetch, fetchProjectsForWorkspace])

  const initializeSession = useCallback(
    async (token: string) => {
      ensureApiBaseUrl()
      const response = await fetch(`${apiBaseUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const message = await parseErrorMessage(response)
        throw new Error(message)
      }

      const userData = await response.json()
      const user = mapUser(userData)
      localStorage.setItem(ACCESS_TOKEN_KEY, token)

      const fetchedWorkspaces = await fetchWorkspacesAndProjects()

      setAuthState({
        user,
        currentWorkspaceId: fetchedWorkspaces[0]?.id ?? null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    },
    [fetchWorkspacesAndProjects],
  )

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!token) {
      setAuthState((previous) => ({ ...previous, isLoading: false }))
      return
    }

    initializeSession(token).catch(() => {
      clearSession()
    })
  }, [initializeSession, clearSession])

  const clearError = useCallback(() => {
    setAuthState((previous) => ({ ...previous, error: null }))
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      ensureApiBaseUrl()

      if (!email || !password) {
        const errorMessage = 'Email and password are required.'
        setAuthState((previous) => ({ ...previous, error: errorMessage }))
        throw new Error(errorMessage)
      }

      setAuthState((previous) => ({ ...previous, isLoading: true, error: null }))

      try {
        const response = await fetch(`${apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
          const message = await parseErrorMessage(response)
          throw new Error(message)
        }

        const data = await response.json()
        await initializeSession(data.access_token)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to sign in right now.'
        clearSession()
        setAuthState((previous) => ({ ...previous, isLoading: false, error: message }))
        throw new Error(message)
      }
    },
    [initializeSession, clearSession],
  )

  const register = useCallback(
    async (data: RegisterData) => {
      ensureApiBaseUrl()

      if (!data.email || !data.password) {
        const message = 'All required fields must be completed.'
        setAuthState((previous) => ({ ...previous, error: message }))
        throw new Error(message)
      }

      setAuthState((previous) => ({ ...previous, isLoading: true, error: null }))

      try {
        const response = await fetch(`${apiBaseUrl}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            first_name: data.firstName,
            last_name: data.lastName,
          }),
        })

        if (!response.ok) {
          const message = await parseErrorMessage(response)
          throw new Error(message)
        }

        await login(data.email, data.password)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to create account.'
        setAuthState((previous) => ({ ...previous, isLoading: false, error: message }))
        throw new Error(message)
      }
    },
    [login],
  )

  const logout = useCallback(async () => {
    ensureApiBaseUrl()
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (token) {
      try {
        await fetch(`${apiBaseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } catch {
        // Ignore logout errors; session will be cleared locally regardless.
      }
    }
    clearSession()
  }, [clearSession])

  const setCurrentWorkspace = useCallback((workspaceId: string) => {
    setAuthState((previous) => ({
      ...previous,
      currentWorkspaceId: workspaceId,
    }))
  }, [])

  const createWorkspace = useCallback(
    async (payload: CreateWorkspacePayload) => {
      if (!payload.name.trim()) {
        throw new Error('Workspace name is required.')
      }

      const response = await authorizedFetch('/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          access_key: payload.accessKey,
          slug: payload.slug,
        }),
      })

      const data = await response.json()
      const workspace = mapWorkspace(data.workspace)

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
        accessKey: data.access_key ?? undefined,
      }
    },
    [authorizedFetch],
  )

  const joinWorkspace = useCallback(
    async (payload: JoinWorkspacePayload) => {
      const response = await authorizedFetch('/workspaces/join', {
        method: 'POST',
        body: JSON.stringify({
          workspace_id: payload.workspaceId,
          access_key: payload.accessKey,
        }),
      })

      const data = await response.json()
      const workspace = mapWorkspace(data.workspace)

      setWorkspaces((previous) => {
        const existing = previous.find((item) => item.id === workspace.id)
        if (existing) {
          return previous.map((item) => (item.id === workspace.id ? workspace : item))
        }
        return [...previous, workspace]
      })

      const projects = await fetchProjectsForWorkspace(workspace.id)
      setProjectsByWorkspace((previous) => ({
        ...previous,
        [workspace.id]: projects,
      }))

      setAuthState((previous) => ({
        ...previous,
        currentWorkspaceId: workspace.id,
      }))

      return workspace
    },
    [authorizedFetch, fetchProjectsForWorkspace],
  )

  const createProject = useCallback(
    async (workspaceId: string, payload: CreateProjectPayload) => {
      const response = await authorizedFetch(`/workspaces/${workspaceId}/projects`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      const project = mapProject(data)

      setProjectsByWorkspace((previous) => ({
        ...previous,
        [workspaceId]: [...(previous[workspaceId] ?? []), project],
      }))

      return project
    },
    [authorizedFetch],
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
