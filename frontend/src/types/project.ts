export interface Project {
  id: string
  name: string
  description?: string
  workspaceId: string
  createdBy: string
  creatorName: string
  projectType?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateProjectPayload {
  name: string
  description?: string
  projectType?: string
  tags?: string[]
}
