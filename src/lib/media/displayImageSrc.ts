/**
 * Pasted featured-media URLs can live on any CDN. next/image only allows a few hosts,
 * and some CDNs refuse hotlinked requests. Known hosts stay as the original URL.
 * Everything else can fall back to the same-origin image proxy.
 */

const DIRECT_HOSTS = new Set([
  'images.unsplash.com',
  'images.pexels.com',
  'i.ytimg.com',
  'www.google.com',
  'lh3.googleusercontent.com',
  'app.vbizme.com',
  'aws-s3-vbizme-vcard.s3.us-east-2.amazonaws.com',
])

const DIRECT_SUFFIXES = ['.amazonaws.com', '.cloudfront.net', '.vbizme.com', '.vbiz.me', '.googleusercontent.com']

export function displayImageSrc(raw: string): string {
  const url = raw.trim()
  if (!url || url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('/')) return url
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return url
    const host = parsed.hostname.toLowerCase()
    if (DIRECT_HOSTS.has(host) || DIRECT_SUFFIXES.some((suffix) => host.endsWith(suffix)) || host.includes('.s3.')) {
      return url
    }
    return `/api/remote-image?url=${encodeURIComponent(parsed.toString())}`
  } catch {
    return url
  }
}
