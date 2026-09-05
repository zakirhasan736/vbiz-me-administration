'use client'

import { loginPathForAuthState, rememberPostLoginPath } from '@/lib/auth/sessionPolicy'
import { useAuth } from '@/providers/AuthProvider'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Loader from './ui/Loader'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      rememberPostLoginPath(`${window.location.pathname}${window.location.search}`)
      router.replace(loginPathForAuthState())
    }
  }, [user, loading, router, pathname])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 text-slate-900 dark:bg-[#09090b] dark:text-white">
        <Loader />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
