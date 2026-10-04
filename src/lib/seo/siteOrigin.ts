/**
 * Canonical production origin for robots.txt, sitemap.xml, metadataBase, and GSC.
 * Prefer NEXT_PUBLIC_APP_URL so local/staging builds do not advertise localhost to crawlers.
 */
export function getSiteOrigin(envUrl: string | null | undefined = process.env.NEXT_PUBLIC_APP_URL): string {
  const fromEnv = envUrl?.trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  return 'https://vbiz.me'
}

export function getGoogleSiteVerification(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || process.env.GOOGLE_SITE_VERIFICATION?.trim() || ''
}

export function getGaMeasurementId(): string {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || ''
}

export function getGtmId(): string {
  return process.env.NEXT_PUBLIC_GTM_ID?.trim() || ''
}
