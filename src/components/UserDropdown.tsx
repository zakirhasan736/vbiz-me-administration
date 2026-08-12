'use client'

import { ContactModal, type OwnerFeedbackMode } from '@/components/dashboard/home/ContactModal'
import { useDashboardTour } from '@/context/DashboardTourContext'
import { useAppSelector } from '@/hooks/redux'
import { logout, useAuth } from '@/providers/AuthProvider'
import { cn } from '@/utils/cn'
import { Compass, LifeBuoy, LogOut, MessageSquareHeart, Settings, UserCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { LogoutConfirmModal } from './LogoutConfirmModal'

const menuItemClassName =
  'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'

function accountTypeLabel(role: string | undefined) {
  if (role === 'super-admin') return 'Super Admin Account'
  if (role === 'admin') return 'Admin Account'
  if (role === 'corporate-owner') return 'Corporate Account'
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
  const { startTour, isActive: isTourActive } = useDashboardTour()
  const menuRef = useRef<HTMLDivElement>(null)

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
                    : role === 'corporate-owner'
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                )}
              >
                {accountTypeLabel(role)}
              </p>
            </div>
            <div className="space-y-1 p-2">
              {role === 'admin' || role === 'super-admin' ? (
                <Link href="/admin/settings" onClick={() => setIsProfileOpen(false)} className={menuItemClassName}>
                  <Settings className="h-4 w-4" /> Admin Settings
                </Link>
              ) : (
                <Link href="/settings" onClick={() => setIsProfileOpen(false)} className={menuItemClassName}>
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              )}
              {role !== 'admin' && role !== 'super-admin' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setOwnerFeedbackMode('feedback')
                      setIsProfileOpen(false)
                    }}
                    className={menuItemClassName}
                  >
                    <MessageSquareHeart className="h-4 w-4" /> Send feedback
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOwnerFeedbackMode('support')
                      setIsProfileOpen(false)
                    }}
                    className={menuItemClassName}
                  >
                    <LifeBuoy className="h-4 w-4 text-indigo-500" /> Contact Support
                  </button>
                </>
              ) : null}
              {role === 'vcard-owner' && !isTourActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false)
                    if (pathname !== '/') {
                      router.push('/')
                    }
                    startTour('dashboard')
                  }}
                  className={menuItemClassName}
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
          fromRole={role === 'corporate-owner' ? 'corporate' : 'single'}
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
