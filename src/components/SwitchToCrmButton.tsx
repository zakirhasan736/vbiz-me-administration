'use client'

import { isStaffRole } from '@/constants/userRole'
import { useAppSelector } from '@/hooks/redux'
import { canSessionUseCrm } from '@/lib/crmAccess'
import { cn } from '@/utils/cn'
import { ArrowLeftRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type SwitchToCrmButtonProps = {
  variant?: 'header' | 'menu'
  className?: string
}

export function SwitchToCrmButton({ variant = 'header', className }: SwitchToCrmButtonProps) {
  const pathname = usePathname()
  const user = useAppSelector((state) => state.user.user)
  const role = user?.role
  const onCrm = pathname === '/crm' || pathname.startsWith('/crm/')
  const staffMayOpenCrm = canSessionUseCrm({
    role,
    allowedModules: user?.allowedModules,
    packageAllowsCrm: false,
  })

  if (isStaffRole(role) && !staffMayOpenCrm && !onCrm) {
    return null
  }

  const href = onCrm ? (isStaffRole(role) ? '/admin/dashboard' : '/') : '/crm'
  const label = onCrm ? 'Cards' : 'CRM'
  const isMenu = variant === 'menu'

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full font-bold tracking-wide transition-colors',
        isMenu
          ? 'w-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-[12px] text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25'
          : 'border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-indigo-400/40 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-200',
        className
      )}
    >
      <ArrowLeftRight className={cn(isMenu ? 'h-3.5 w-3.5' : 'h-3 w-3')} />
      <span>{label}</span>
    </Link>
  )
}
