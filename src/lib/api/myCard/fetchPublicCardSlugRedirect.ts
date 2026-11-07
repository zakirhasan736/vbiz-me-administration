import { fetchPublicCardResponse, getApiBaseUrl } from '@/lib/api/serverApi'

type SlugRedirectResponse = {
  success?: boolean
  data?: { slug?: string | null } | null
}

/**
 * Current slug for a renamed card's old address, or null. Never throws: a failed lookup
 * simply falls back to the normal 404 for a missing card.
 */
export async function fetchPublicCardSlugRedirect(slug: string): Promise<string | null> {
  const trimmed = slug.trim()
  if (!trimmed) return null
  try {
    const response = await fetchPublicCardResponse(`${getApiBaseUrl()}/v/${encodeURIComponent(trimmed)}/redirect`)
    if (!response.ok) return null
    const json = (await response.json()) as SlugRedirectResponse
    const target = typeof json.data?.slug === 'string' ? json.data.slug.trim() : ''
    if (!json.success || !target || target.toLowerCase() === trimmed.toLowerCase()) return null
    return target
  } catch {
    return null
  }
}
