export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  createdAt: string
}

export interface RegisterData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface AuthState {
  user: User | null
  currentWorkspaceId: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
