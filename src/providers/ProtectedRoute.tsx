'use client'
import Loader from '@/components/ui/Loader'
import { useAppSelector } from '@/hooks/redux'
import { TUserRole } from '@/interfaces'
import Cookies from 'js-cookie'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface IProps {
  children: React.ReactNode
  role: TUserRole[] | '*'
}

const ProtectedRoute = ({ children, role }: IProps) => {
  const { user, isLoading } = useAppSelector((state) => state.user)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        Cookies.set('redirect_after_login', pathname)
        router.replace('/login')
      }

      if (user && role !== '*' && role && !role.includes(user.role!)) {
        router.replace('/')
      }

      // if (user && !user.isVerified) {
      //   router.replace("/verification");
      // }
    }
  }, [isLoading, user, router, role, pathname])

  if (isLoading) {
    return <Loader className="h-dvh" />
  }

  if (!user || (role !== '*' && role && !role.includes(user.role!))) {
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute
