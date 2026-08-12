export type CanvaConnectionStatus = {
  connected: boolean
  configured?: boolean
  scope?: string
  connectedAt?: number
  expiresAt?: number
}

export type CanvaExportFormat = 'png' | 'jpg' | 'mp4' | 'pdf'

export type CanvaLibraryItem = {
  id: string
  name: string
  thumb?: string
  updatedAt?: number
  pageCount?: number
}
