export type CanvaTokenResponse = {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  scope: string
}

export type StoredCanvaTokens = {
  accessToken: string
  refreshToken: string
  expiresAt: number
  scope: string
  connectedAt: number
}

export type CanvaConnectionStatus = {
  connected: boolean
  scope?: string
  connectedAt?: number
  expiresAt?: number
}
