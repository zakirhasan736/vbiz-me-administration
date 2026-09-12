/** Mirrors backend storefront detection for AI wizard UX. */
export function looksLikeStorefrontUrl(rawUrl: string): boolean {
  const value = String(rawUrl || '').trim()
  if (!value) return false
  let host = ''
  let path: string
  let href: string
  try {
    const parsed = new URL(value.startsWith('http') ? value : `https://${value}`)
    host = parsed.hostname.toLowerCase()
    path = `${parsed.pathname}${parsed.search}`.toLowerCase()
    href = parsed.href.toLowerCase()
  } catch {
    href = value.toLowerCase()
    path = href
  }

  if (
    /amway\.|amwayglobal\.|quixtar\.|myshop\.amway|amway\.com\/.*myshop|amway\.com\/.*shop/i.test(href) ||
    /myshop|my-shop|mystore|my-store|storefront|seller|vendor|affiliate|ibo\b|independent.?seller/i.test(
      `${host} ${path}`
    )
  ) {
    return true
  }

  if (
    /shopify\.com|myshopify\.com|etsy\.com\/shop|amazon\.[a-z.]+\/shop|ebay\.[a-z.]+\/usr|walmart\.[a-z.]+\/seller/i.test(
      href
    )
  ) {
    return true
  }

  if (/\/(shop|store|seller|vendor|affiliate|rep|consultant|distributor)(\/|$)/i.test(path)) {
    return true
  }

  return false
}
