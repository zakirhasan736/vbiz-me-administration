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

export type CanvaEditSessionStatus = 'awaiting_return' | 'importing' | 'ready' | 'failed' | 'expired' | 'canceled'

export type CanvaEditSession = {
  id: string
  sessionId: string
  correlationState: string
  profileId: string
  fieldKey: string
  itemKey?: string | null
  attachmentType?: string | null
  designId: string
  designTitle?: string | null
  mediaKind: string
  exportFormat: string
  targetWidth?: number | null
  targetHeight?: number | null
  builderRoute: string
  status: CanvaEditSessionStatus | string
  resultUrl?: string | null
  resultFilename?: string | null
  resultMime?: string | null
  attachmentId?: string | null
  errorMessage?: string | null
  expiresAt: string
  createdAt: string
  completedAt?: string | null
  editUrl?: string
}

export type CanvaCreateDesignInput = {
  profileId: string
  fieldKey: string
  itemKey?: string | null
  attachmentType?: string | null
  mediaKind?: 'image' | 'video'
  width?: number
  height?: number
  exportFormat?: CanvaExportFormat
  builderRoute: string
  title?: string
  designId?: string
}
