import Layout from '@/components/Layout'
import { RequireAuth } from '@/components/require-auth'
import { DashboardTourRoot } from '@/components/tour/DashboardTourRoot'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <DashboardTourRoot>
        <Layout>{children}</Layout>
      </DashboardTourRoot>
    </RequireAuth>
  )
}
