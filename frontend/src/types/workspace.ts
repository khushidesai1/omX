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

export interface WorkspaceDetail extends Workspace {
  members: WorkspaceMember[]
  projectCount: number
  accessKey?: string | null
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

export interface UpdateWorkspacePayload {
  name?: string
  description?: string
  accessKey?: string
  slug?: string
  isPublic?: boolean
}
