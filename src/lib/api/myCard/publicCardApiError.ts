export type PublicCardApiErrorKind =
  | 'RATE_LIMITED'
  | 'PUBLIC_CARD_API_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'MALFORMED_PAYLOAD'
  | 'UNEXPECTED_STATUS'

export class PublicCardApiError extends Error {
  constructor(
    message: string,
    readonly kind: PublicCardApiErrorKind,
    readonly status: number | null,
    readonly requestId?: string
  ) {
    super(message)
    this.name = 'PublicCardApiError'
  }
}

export function publicCardRequestId(response: Response): string | undefined {
  return response.headers.get('x-vbiz-request-id') || response.headers.get('x-request-id') || undefined
}

export function publicCardApiErrorFromStatus(status: number, requestId?: string): PublicCardApiError {
  if (status === 429) {
    return new PublicCardApiError('Public card API rate limited', 'RATE_LIMITED', status, requestId)
  }
  if (status === 401 || status === 403) {
    return new PublicCardApiError(
      'Public card API rejected the request (configuration or integration)',
      'CONFIGURATION_ERROR',
      status,
      requestId
    )
  }
  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return new PublicCardApiError('Public card API is unavailable', 'PUBLIC_CARD_API_ERROR', status, requestId)
  }
  return new PublicCardApiError(`Public card API returned ${status}`, 'UNEXPECTED_STATUS', status, requestId)
}

export function logPublicCardFetchFailure(details: {
  slug: string
  status: number | null
  kind: PublicCardApiErrorKind
  requestId?: string
}) {
  console.error('[fetchMyCardBySlug]', {
    slug: details.slug,
    status: details.status,
    kind: details.kind,
    requestId: details.requestId,
    transport: process.env.SERVER_API_URL?.trim() ? 'server-internal' : 'public',
  })
}
