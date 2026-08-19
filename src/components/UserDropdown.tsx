'use client'

import { ContactModal, type OwnerFeedbackMode } from '@/components/dashboard/home/ContactModal'
import { isStaffRole } from '@/constants/userRole'
import { useDashboardTour } from '@/context/DashboardTourContext'
import { useAppSelector } from '@/hooks/redux'
import { useAccountStatus } from '@/hooks/useAccountStatus'
import { useOwnerMode } from '@/hooks/useOwnerMode'
import { ACCOUNT_SUSPENDED_MESSAGE } from '@/lib/accountStatus'
import { notify } from '@/lib/toast/toast'
import { logout, useAuth } from '@/providers/AuthProvider'
import { cn } from '@/utils/cn'
import { Compass, LifeBuoy, LogOut, MessageSquareHeart, Settings, UserCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { LogoutConfirmModal } from './LogoutConfirmModal'
import { SwitchToCrmButton } from './SwitchToCrmButton'

const menuItemClassName =
  'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'

function accountTypeLabel(role: string | undefined, ownerMode: 'single' | 'corporate' | null) {
  if (role === 'super-admin') return 'Super Admin Account'
  if (role === 'admin') return 'Admin Account'
  if (ownerMode === 'corporate') return 'Corporate Account'
  return 'Single Account'
}

export function UserDropdown() {
  const router = useRouter()
  const pathname = usePathname()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [ownerFeedbackMode, setOwnerFeedbackMode] = useState<OwnerFeedbackMode | null>(null)
  const { user } = useAuth()
  const role = useAppSelector((state) => state.user.user?.role)
  const { ownerMode, isCorporateBackOffice, isSingleBackOffice } = useOwnerMode()
  const isStaff = isStaffRole(role)
  const { isSuspended, canPerformAccountActions } = useAccountStatus()
  const { startTour, isActive: isTourActive } = useDashboardTour()
  const menuRef = useRef<HTMLDivElement>(null)

  const guardAccountAction = (event: React.MouseEvent, href?: string) => {
    if (!isSuspended) return
    event.preventDefault()
    notify.warning(ACCOUNT_SUSPENDED_MESSAGE)
    setIsProfileOpen(false)
    if (href) {
      /* stay put */
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      setShowLogoutModal(false)
      router.push('/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <div className="relative isolate z-50" ref={menuRef}>
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center gap-2 rounded-full border border-transparent p-1 transition-colors hover:bg-slate-100 focus:outline-none dark:hover:bg-white/5"
        >
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-800">
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt="Profile"
                className="h-full w-full object-cover"
                width={100}
                height={100}
              />
            ) : (
              <UserCircle className="h-5 w-5 text-slate-400" />
            )}
          </div>
        </button>

        {isProfileOpen && (
          <div className="animate-in zoom-in-95 absolute top-full right-0 z-100 mt-3 w-56 origin-top-right rounded-2xl border border-slate-200 bg-white py-1 shadow-xl duration-150 dark:border-white/10 dark:bg-[#0b0f19]">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-white/5">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {user?.displayName || 'User'}
              </p>
              <p
                className={cn(
                  'mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-widest uppercase',
                  role === 'admin' || role === 'super-admin'
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400'
                    : isCorporateBackOffice
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                )}
              >
                {accountTypeLabel(role, ownerMode)}
              </p>
              {isSuspended ? (
                <p className="mt-2 rounded-md bg-rose-50 px-2 py-1 text-[10px] font-extrabold tracking-wide text-rose-700 uppercase dark:bg-rose-500/15 dark:text-rose-300">
                  Suspended — actions locked
                </p>
              ) : null}
            </div>
            <div className="space-y-1 p-2">
              <div className="px-1 pb-1">
                <SwitchToCrmButton variant="menu" />
              </div>
              {isStaff ? (
                <Link href="/admin/settings" onClick={() => setIsProfileOpen(false)} className={menuItemClassName}>
                  <Settings className="h-4 w-4" /> Admin Settings
                </Link>
              ) : (
                <Link
                  href="/settings"
                  onClick={(e) => {
                    if (!canPerformAccountActions) {
                      guardAccountAction(e)
                      return
                    }
                    setIsProfileOpen(false)
                  }}
                  className={cn(menuItemClassName, isSuspended && 'opacity-50')}
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              )}
              {!isStaff ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      if (isSuspended) {
                        guardAccountAction(e)
                        return
                      }
                      setOwnerFeedbackMode('feedback')
                      setIsProfileOpen(false)
                    }}
                    className={cn(menuItemClassName, isSuspended && 'opacity-50')}
                  >
                    <MessageSquareHeart className="h-4 w-4" /> Send feedback
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      if (isSuspended) {
                        guardAccountAction(e)
                        return
                      }
                      setOwnerFeedbackMode('support')
                      setIsProfileOpen(false)
                    }}
                    className={cn(menuItemClassName, isSuspended && 'opacity-50')}
                  >
                    <LifeBuoy className="h-4 w-4 text-indigo-500" /> Contact Support
                  </button>
                </>
              ) : null}
              {isSingleBackOffice &&
              !isTourActive &&
              !pathname.startsWith('/vcards/create') &&
              !pathname.startsWith('/vcards/edit') ? (
                <button
                  type="button"
                  onClick={(e) => {
                    if (isSuspended) {
                      guardAccountAction(e)
                      return
                    }
                    setIsProfileOpen(false)
                    if (pathname !== '/') {
                      router.push('/')
                    }
                    startTour('dashboard')
                  }}
                  className={cn(menuItemClassName, isSuspended && 'cursor-not-allowed opacity-50')}
                  aria-disabled={isSuspended || undefined}
                >
                  <Compass className="h-4 w-4" /> Take a tour
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false)
                  setShowLogoutModal(true)
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>

      {ownerFeedbackMode && (
        <ContactModal
          key={ownerFeedbackMode}
          mode={ownerFeedbackMode}
          onClose={() => setOwnerFeedbackMode(null)}
          fromRole={isCorporateBackOffice ? 'corporate' : 'single'}
          fromName={user?.displayName || 'Owner'}
          fromEmail={user?.email || undefined}
        />
      )}

      {showLogoutModal && (
        <LogoutConfirmModal
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
          isLoading={isLoggingOut}
        />
      )}
    </>
  )
}
