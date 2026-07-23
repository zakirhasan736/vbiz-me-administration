'use client'

import { TakeTourBanner, TakeTourTrigger } from '@/components/tour/TakeTourBanner'
import { useDashboardTour } from '@/context/DashboardTourContext'
import { requestTourRemeasure } from '@/lib/dashboardTour'
import { cn } from '@/utils/cn'
import { Contact, LayoutDashboard, LogOut, Menu, Moon, Settings, Sun, UserCircle, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { logout, useAuth } from './Auth'
import { LogoutConfirmModal } from './LogoutConfirmModal'

function subscribeToTheme(callback: () => void) {
  window.addEventListener('theme-change', callback)
  return () => window.removeEventListener('theme-change', callback)
}

function getDarkModeSnapshot() {
  return document.documentElement.classList.contains('dark')
}

function getServerDarkModeSnapshot() {
  return false
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const router = useRouter()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isDarkMode = useSyncExternalStore(subscribeToTheme, getDarkModeSnapshot, getServerDarkModeSnapshot)
  const { user } = useAuth()
  const { registerMobileNavOpener, isActive: isTourActive, currentStep } = useDashboardTour()
  const menuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const keepMobileNavOpen = isTourActive && Boolean(currentStep?.openMobileNav)
  const showMobileMenu = isMobileMenuOpen && (!isTourActive || keepMobileNavOpen)

  useEffect(() => {
    registerMobileNavOpener(() => setIsMobileMenuOpen(true))
  }, [registerMobileNavOpener])

  useEffect(() => {
    if (showMobileMenu && isTourActive) {
      requestAnimationFrame(() => requestTourRemeasure())
    }
  }, [showMobileMenu, isTourActive])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('button[data-mobile-toggle]') &&
        !keepMobileNavOpen
      ) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [keepMobileNavOpen])

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    window.dispatchEvent(new Event('theme-change'))
  }

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

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, tourId: 'tour-nav-dashboard' },
    { name: 'My vCards', path: '/vcards', icon: Contact, tourId: 'tour-nav-vcards' },
    { name: 'Settings', path: '/settings', icon: Settings, tourId: 'tour-nav-settings' },
  ]

  return (
    <div className="selection:bg-primary-500/30 relative flex min-h-screen flex-col overflow-x-hidden bg-slate-50 font-sans text-slate-900 dark:bg-[#070a13] dark:text-slate-100">
      {/* Background Decorators */}
      <div className="bg-primary-500/20 dark:bg-primary-600/10 pointer-events-none fixed top-0 left-1/2 -z-10 h-[40vh] w-full max-w-4xl -translate-x-1/2 rounded-full blur-[120px]" />

      {/* Floating Top Navigation */}
      <header className="sticky top-4 z-50 mx-4 rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur-xl md:mx-8 lg:mx-auto lg:max-w-7xl dark:border-white/10 dark:bg-[#0b0f19]/70">
        <div className="flex h-16 min-w-0 items-center justify-between gap-2 px-4 md:gap-3 md:px-6">
          <div className="flex min-w-0 items-center gap-4 lg:gap-8">
            <Link href="/" className="group flex items-center gap-2">
              <div className="bg-primary-600 dark:bg-primary-500 flex h-8 w-8 items-center justify-center rounded-xl font-bold text-white shadow-sm transition-transform group-hover:scale-105">
                v
              </div>
              <span className="hidden text-lg font-bold tracking-tight text-slate-900 sm:block dark:text-white">
                vbiz.me
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden min-w-0 items-center gap-0.5 lg:flex">
              {navItems.map((item) => {
                const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
                return (
                  <Link
                    key={item.name}
                    id={item.tourId}
                    href={item.path}
                    data-tour-id={item.tourId}
                    className={cn(
                      'group relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold',
                      isActive
                        ? 'dark:text-primary-400 text-white'
                        : 'text-slate-600 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-200'
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'pointer-events-none absolute inset-0 rounded-xl',
                        isActive
                          ? 'dark:bg-primary-500/15 bg-slate-900'
                          : 'bg-transparent group-hover:bg-slate-100 dark:group-hover:bg-white/5'
                      )}
                    />
                    <item.icon className="relative z-10 h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                    <span className="relative z-10 whitespace-nowrap">{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
            {!isTourActive && <TakeTourTrigger className="hidden lg:inline-flex" />}

            <button
              onClick={toggleTheme}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            <div className="hidden h-6 w-px bg-slate-200 lg:block dark:bg-white/10"></div>

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
                      <LogOut className="h-[18px] w-[18px]" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              data-mobile-toggle
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:hover:bg-white/10 dark:hover:text-white"
            >
              {showMobileMenu ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {showMobileMenu && (
          <div
            ref={mobileMenuRef}
            className="animate-in slide-in-from-top-2 absolute top-full right-0 left-0 rounded-2xl border-t border-slate-200 bg-white p-4 shadow-lg backdrop-blur-xl lg:hidden dark:border-white/5 dark:bg-[#0b0f19]"
          >
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    data-tour-id={item.tourId}
                    onClick={() => {
                      if (!keepMobileNavOpen) setIsMobileMenuOpen(false)
                    }}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold',
                      isActive
                        ? 'dark:text-primary-400 text-white'
                        : 'text-slate-600 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-200'
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'pointer-events-none absolute inset-0 rounded-xl',
                        isActive
                          ? 'dark:bg-primary-500/15 bg-slate-900'
                          : 'bg-transparent group-hover:bg-slate-100 dark:group-hover:bg-white/5'
                      )}
                    />
                    <item.icon className="relative z-10 h-5 w-5 shrink-0" strokeWidth={2} />
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                )
              })}
              {!isTourActive && (
                <TakeTourTrigger
                  className="mt-1 w-full justify-start border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                  onStart={() => setIsMobileMenuOpen(false)}
                />
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main id="main-scroll" className="wrapper relative min-h-0 flex-1 py-8">
        <TakeTourBanner />
        {children}
      </main>

      {showLogoutModal && (
        <LogoutConfirmModal
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
          isLoading={isLoggingOut}
        />
      )}
    </div>
  )
}

export default Layout
