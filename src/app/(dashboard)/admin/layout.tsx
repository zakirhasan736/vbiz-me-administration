import AdminLayout from '@/components/admin/AdminLayout'
import ProtectedRoute from '@/providers/ProtectedRoute'

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute role={['admin', 'super-admin']}>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  )
}
