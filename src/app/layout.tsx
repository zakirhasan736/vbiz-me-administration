import {
  VBIZ_APPLE_TOUCH_ICON_PATH,
  VBIZ_DEFAULT_FAVICON_PATH,
  VBIZ_FAVICON_32_PATH,
  VBIZ_LOGO_PATH,
} from '@/components/brand/VbizBrandMark'
import { ToastViewport } from '@/components/feedback/ToastViewport'
import { GoogleAnalyticsBootstrap, GoogleTagManagerNoscript } from '@/components/GoogleAnalyticsBootstrap'
import { TranslationEarlyBootstrap } from '@/components/i18n/TranslationEarlyBootstrap'
import { IframeEmbedBootstrap } from '@/components/IframeEmbedBootstrap'
import { PwaInstallBootstrap } from '@/components/PwaInstallBootstrap'
import { SafeDomUnmountBootstrap } from '@/components/SafeDomUnmountBootstrap'
import { SentryBootstrap } from '@/components/SentryBootstrap'
import { StaleChunkReloadBootstrap } from '@/components/StaleChunkReloadBootstrap'
import { fetchPublicCardBootstrap } from '@/lib/api/myCard/fetchPublicCardBootstrap'
import { publicCardPageSlug } from '@/lib/profileRoutes'
import { resolveRequestOrigin } from '@/lib/seo/publicCardSeo'
import { PublicCardServerDocument } from '@/lib/seo/PublicCardServerDocument'
import { getGoogleSiteVerification, getSiteOrigin } from '@/lib/seo/siteOrigin'
import { NotificationToast } from '@/profile-app/components/NotificationToast'
import { PushNotificationRegistrar } from '@/profile-app/components/PushNotificationRegistrar'
import ClientProviders from '@/providers/ClientProviders'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import './globals.css'

const siteOrigin = getSiteOrigin()
const googleVerification = getGoogleSiteVerification()

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: 'Vbiz - Backoffice',
  description: 'Manage your vCards and digital business presence',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  icons: {
    icon: [
      { url: VBIZ_FAVICON_32_PATH, sizes: '32x32', type: 'image/png' },
      { url: VBIZ_DEFAULT_FAVICON_PATH, sizes: '192x192', type: 'image/png' },
      { url: VBIZ_LOGO_PATH, type: 'image/webp' },
    ],
    shortcut: VBIZ_FAVICON_32_PATH,
    apple: VBIZ_APPLE_TOUCH_ICON_PATH,
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headerStore = await headers()
  const slug = publicCardPageSlug(headerStore.get('x-pathname') || '')
  const origin = resolveRequestOrigin(
    headerStore.get('x-forwarded-host') || headerStore.get('host'),
    headerStore.get('x-forwarded-proto')
  )
  const bootstrap = slug ? await fetchPublicCardBootstrap(slug).catch(() => null) : null

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased" suppressHydrationWarning>
        {bootstrap?.myCard ? (
          <PublicCardServerDocument
            slug={slug || ''}
            origin={origin}
            myCard={bootstrap.myCard}
            sections={bootstrap.sections}
          />
        ) : null}
        {/* GTM noscript must be first in <body>; beforeInteractive scripts hoist into <head>. */}
        <GoogleTagManagerNoscript />
        <GoogleAnalyticsBootstrap />
        <StaleChunkReloadBootstrap />
        <SafeDomUnmountBootstrap />
        <SentryBootstrap />
        <IframeEmbedBootstrap />
        <PwaInstallBootstrap />
        <TranslationEarlyBootstrap />
        <ClientProviders>
          <PushNotificationRegistrar />
          {children}
          <NotificationToast />
          <ToastViewport />
        </ClientProviders>
      </body>
    </html>
  )
}
