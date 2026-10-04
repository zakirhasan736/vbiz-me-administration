import { getSiteOrigin } from '@/lib/seo/siteOrigin'
import type { MetadataRoute } from 'next'

/**
 * Crawl policy for Google Search Console:
 * - Index public cards under /vCard/
 * - Keep admin, auth, and API routes out of the index
 */
export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin()

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/vCard/'],
        disallow: [
          '/api/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/set-password',
          '/verify-email',
          '/admin',
          '/vcards',
          '/crm',
          '/events',
          '/settings',
          '/teamvcard',
          '/1-on-1',
          '/_next/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/vCard/'],
        disallow: [
          '/api/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/set-password',
          '/verify-email',
          '/admin',
          '/vcards',
          '/crm',
          '/events',
          '/settings',
          '/teamvcard',
          '/1-on-1',
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin.replace(/^https?:\/\//, ''),
  }
}
