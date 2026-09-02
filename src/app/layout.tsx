import { VBIZ_LOGO_PATH } from '@/components/brand/VbizBrandMark'
import { ToastViewport } from '@/components/feedback/ToastViewport'
import { TranslationEarlyBootstrap } from '@/components/i18n/TranslationEarlyBootstrap'
import { IframeEmbedBootstrap } from '@/components/IframeEmbedBootstrap'
import { PwaInstallBootstrap } from '@/components/PwaInstallBootstrap'
import { NotificationToast } from '@/profile-app/components/NotificationToast'
import { PushNotificationRegistrar } from '@/profile-app/components/PushNotificationRegistrar'
import ClientProviders from '@/providers/ClientProviders'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vbiz - Backoffice',
  description: 'Manage your vCards and digital business presence',
  icons: {
    icon: VBIZ_LOGO_PATH,
    shortcut: VBIZ_LOGO_PATH,
    apple: VBIZ_LOGO_PATH,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased" suppressHydrationWarning>
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
