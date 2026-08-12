'use client'

import AnnouncementBanner from '@/components/AnnouncementBanner'
import { NotificationCenter } from '@/components/NotificationCenter'
import { useDashboardTour } from '@/context/DashboardTourContext'
import { useAppSelector } from '@/hooks/redux'
import { requestTourRemeasure } from '@/lib/dashboardTour'
import { roleToAudience } from '@/lib/notifications'
import { cn } from '@/utils/cn'
import { Contact, LayoutDashboard, Menu, Moon, Sun, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { UserDropdown } from './UserDropdown'

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isDarkMode = useSyncExternalStore(subscribeToTheme, getDarkModeSnapshot, getServerDarkModeSnapshot)
  const { registerMobileNavOpener, isActive: isTourActive, currentStep } = useDashboardTour()
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const keepMobileNavOpen = isTourActive && Boolean(currentStep?.openMobileNav)
  const showMobileMenu = isMobileMenuOpen && (!isTourActive || keepMobileNavOpen)
  const role = useAppSelector((state) => state.user.user?.role)
  const audience = roleToAudience(role)
  const isAdminRoute = pathname.startsWith('/admin')
  const isEditorRoute = pathname.startsWith('/vcards/create') || pathname.startsWith('/vcards/edit')

  useEffect(() => {
    if ((role === 'admin' || role === 'super-admin') && !isAdminRoute && !isEditorRoute) {
      router.replace('/admin/dashboard')
      return
    }
    if (role === 'corporate-owner' && pathname === '/vcards') {
      router.replace('/teamvcard')
    }
  }, [role, isAdminRoute, isEditorRoute, pathname, router])

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

  const navItems =
    role === 'admin' || role === 'super-admin'
      ? [
          { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, tourId: 'tour-nav-dashboard' },
          { name: 'My Cards', path: '/admin/mycards', icon: Contact, tourId: 'tour-nav-vcards' },
        ]
      : [
          { name: 'Dashboard', path: '/', icon: LayoutDashboard, tourId: 'tour-nav-dashboard' },
          ...(role === 'corporate-owner'
            ? [{ name: 'Team vCards', path: '/teamvcard', icon: Contact, tourId: 'tour-nav-teamvcard' }]
            : [{ name: 'My vCards', path: '/vcards', icon: Contact, tourId: 'tour-nav-vcards' }]),
        ]

  // Admin console provides its own shell; avoid double chrome on /admin/*
  if (isAdminRoute) {
    return <>{children}</>
  }

  const brandHref = role === 'admin' || role === 'super-admin' ? '/admin/dashboard' : '/'
  const showAnnouncementBanner = role === 'vcard-owner' || role === 'corporate-owner'

  return (
    <div className="selection:bg-primary-500/30 relative flex min-h-screen flex-col overflow-x-clip bg-slate-50 font-sans text-slate-900 dark:bg-[#070a13] dark:text-slate-100">
      <div className="bg-primary-500/20 dark:bg-primary-600/10 pointer-events-none fixed top-0 left-1/2 -z-10 h-[40vh] w-full max-w-4xl -translate-x-1/2 rounded-full blur-[120px]" />

      <header
        className={cn(
          'z-50 mx-4 mt-3 rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur-xl md:mx-8 lg:mx-auto lg:max-w-7xl dark:border-white/10 dark:bg-[#0b0f19]/70',
          // Editor (Card Settings): let the app navbar scroll away; only the settings sidebar sticks.
          isEditorRoute ? 'relative' : 'sticky top-4'
        )}
      >
        <div className="flex h-16 min-w-0 items-center justify-between gap-2 px-4 md:gap-3 md:px-6">
          <div className="flex min-w-0 items-center gap-4 lg:gap-8">
            <Link href={brandHref} className="group flex items-center gap-2">
              <div className="bg-primary-600 dark:bg-primary-500 flex h-8 w-8 items-center justify-center rounded-xl font-bold text-white shadow-sm transition-transform group-hover:scale-105">
                v
              </div>
              <span className="hidden text-lg font-bold tracking-tight text-slate-900 sm:block dark:text-white">
                vbiz.me
              </span>
            </Link>

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
                    <item.icon className="relative z-10 h-4.5 w-4.5 shrink-0" strokeWidth={2} />
                    <span className="relative z-10 whitespace-nowrap">{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
            <NotificationCenter
              audience={audience}
              title={
                audience === 'corporate' ? 'Corporate Alerts' : audience === 'admin' ? 'Admin Alerts' : 'Your Alerts'
              }
            />

            <button
              onClick={toggleTheme}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            <div className="hidden h-6 w-px bg-slate-200 lg:block dark:bg-white/10"></div>

            <UserDropdown />

            <button
              data-mobile-toggle
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:hover:bg-white/10 dark:hover:text-white"
            >
              {showMobileMenu ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

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
            </nav>
          </div>
        )}
      </header>

      <AnnouncementBanner enabled={showAnnouncementBanner} />

      <main id="main-scroll" className="wrapper relative min-h-0 min-w-0 flex-1 overflow-x-clip py-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
