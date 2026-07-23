'use client'

import { useAuth } from '@/components/Auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Loader from './ui/Loader'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

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
