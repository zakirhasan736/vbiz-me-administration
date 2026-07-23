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
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
