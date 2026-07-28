'use client'

import { TakeTourTrigger } from '@/components/tour/TakeTourBanner'
import { useDashboardTour } from '@/context/DashboardTourContext'
import { logout, useAuth } from '@/providers/AuthProvider'
import { LogOut, Settings, UserCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { LogoutConfirmModal } from './LogoutConfirmModal'

export function UserDropdown() {
  const router = useRouter()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { user } = useAuth()
  const { isActive: isTourActive } = useDashboardTour()
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
              <p className="text-primary-600 dark:text-primary-400 mt-1 text-[11px] font-bold tracking-widest uppercase">
                Free Plan
              </p>
            </div>
            <div className="p-2">
              <Link
                href="/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <Settings className="h-4 w-4" /> Account Settings
              </Link>
              {!isTourActive && (
                <TakeTourTrigger
                  className="w-full justify-start border-transparent bg-transparent px-3 py-2.5 text-slate-600 hover:border-transparent hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                  onStart={() => setIsProfileOpen(false)}
                />
              )}
              <button
                onClick={() => {
                  setIsProfileOpen(false)
                  setShowLogoutModal(true)
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <LogOut className="h-4.5 w-4.5" />
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>

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
