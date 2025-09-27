export interface StorageConnection {
  id: string
  projectId: string
  bucketName: string
  gcpProjectId?: string
  prefix?: string
  description?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface StorageBucketSummary {
  name: string
  location?: string
  storageClass?: string
}

export interface StorageObjectSummary {
  name: string
  size?: number
  updatedAt?: string
  contentType?: string
  storageClass?: string
}

export interface StorageObjectListResponse {
  folders: string[]
  files: StorageObjectSummary[]
}

export interface StorageSignedUrlResponse {
  url: string
  expiresIn: number
}

export interface StorageSignedUrlRequest {
  bucketName: string
  objectPath: string
  contentType?: string
  expiresIn?: number
}

export interface StorageObjectDeleteRequest {
  bucketName: string
  objectPath: string
}
