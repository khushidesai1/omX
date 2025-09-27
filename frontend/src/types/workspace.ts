export type WorkspaceRole = 'owner' | 'admin' | 'member'

export interface Workspace {
  id: string
  name: string
  description?: string
  ownerId: string
  slug: string
  hasAccessKey: boolean
  isPublic: boolean
  memberCount: number
  role: WorkspaceRole
  createdAt: string
}

export interface WorkspaceMember {
  userId: string
  email: string
  firstName?: string
  lastName?: string
  role: WorkspaceRole
  joinedAt: string
}

export interface CreateWorkspacePayload {
  name: string
  description?: string
  accessKey?: string
  slug?: string
}

export interface JoinWorkspacePayload {
  workspaceId: string
  accessKey?: string
}
