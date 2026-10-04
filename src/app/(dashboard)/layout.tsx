import Layout from '@/components/Layout'
import { RequireAuth } from '@/components/require-auth'
import { DashboardTourRoot } from '@/components/tour/DashboardTourRoot'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <DashboardTourRoot>
        <Layout>{children}</Layout>
      </DashboardTourRoot>
    </RequireAuth>
  )
}
