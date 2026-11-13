/** Server-side fetch for public http(s) resources. Blocks local and private targets. */

export class PublicFetchError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

const REDIRECT_LIMIT = 4
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

export function isBlockedPublicHost(hostname: string): boolean {
  const host = hostname
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
  if (!host) return true
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true
  }
  if (host === '0.0.0.0' || host === '::1' || host === 'metadata.google.internal') return true
  if (host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) return true
  if (host.startsWith('::ffff:')) {
    const mapped = host.slice('::ffff:'.length)
    if (isBlockedPublicHost(mapped)) return true
  }

  const parts = host.split('.')
  if (parts.length === 4 && parts.every((part) => /^\d+$/.test(part))) {
    const octets = parts.map((part) => Number(part))
    if (octets.some((n) => n > 255)) return true
    const [a, b] = octets
    if (a === 0 || a === 10 || a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true
  }
  return false
}

function assertPublicUrl(url: URL) {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new PublicFetchError('Only http(s) links can be used', 400)
  }
  if (url.username || url.password) {
    throw new PublicFetchError('Links with a username or password are not allowed', 400)
  }
  if (url.protocol === 'http:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new PublicFetchError('Gallery and image links need to start with https://', 400)
  }
  if (isBlockedPublicHost(url.hostname)) {
    throw new PublicFetchError('That link cannot be fetched', 400)
  }
}

async function readCapped(response: Response, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(response.headers.get('content-length') || '0')
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel()
    throw new PublicFetchError('That file is too large to preview', 413)
  }
  const reader = response.body?.getReader()
  if (!reader) return new Uint8Array()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new PublicFetchError('That file is too large to preview', 413)
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

export async function fetchPublicResource(
  rawUrl: string,
  options?: { maxBytes?: number; timeoutMs?: number }
): Promise<{ url: string; contentType: string; bytes: Uint8Array }> {
  let current: URL
  try {
    current = new URL(rawUrl)
  } catch {
    throw new PublicFetchError('Paste a full https:// link', 400)
  }

  const maxBytes = options?.maxBytes ?? 1_200_000
  const timeoutMs = options?.timeoutMs ?? 8000

  for (let hop = 0; hop <= REDIRECT_LIMIT; hop += 1) {
    assertPublicUrl(current)
    let response: Response
    try {
      response = await fetch(current, {
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          Accept: 'text/html,application/xhtml+xml,image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'User-Agent': BROWSER_UA,
        },
      })
    } catch {
      throw new PublicFetchError('Could not open that link', 502)
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      await response.body?.cancel()
      if (!location) throw new PublicFetchError('Could not open that link', 502)
      current = new URL(location, current)
      continue
    }

    if (!response.ok) {
      await response.body?.cancel()
      throw new PublicFetchError('Could not open that link', 502)
    }

    const bytes = await readCapped(response, maxBytes)
    return {
      url: current.toString(),
      contentType: (response.headers.get('content-type') || '').toLowerCase(),
      bytes,
    }
  }

  throw new PublicFetchError('Could not open that link', 502)
}
