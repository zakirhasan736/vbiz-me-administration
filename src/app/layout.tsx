import { ToastViewport } from '@/components/feedback/ToastViewport'
import { TranslationEarlyBootstrap } from '@/components/i18n/TranslationEarlyBootstrap'
import { IframeEmbedBootstrap } from '@/components/IframeEmbedBootstrap'
import { NotificationToast } from '@/profile-app/components/NotificationToast'
import { PushNotificationRegistrar } from '@/profile-app/components/PushNotificationRegistrar'
import ClientProviders from '@/providers/ClientProviders'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vbiz - Backoffice',
  description: 'Manage your vCards and digital business presence',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <IframeEmbedBootstrap />
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
