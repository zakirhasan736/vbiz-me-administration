import DashboardHomeView from '@/views/DashboardHomeView'
import type { Metadata } from 'next'

/** SEMrush and other crawlers start at /. This page must not send noindex. */
export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function DashboardHomePage() {
  return <DashboardHomeView />
}
