'use client'

import { LogoutConfirmModal } from '@/components/LogoutConfirmModal'
import { ModalPortal } from '@/components/ModalPortal'
import NotificationCenter from '@/components/NotificationCenter'
import { UserDropdown } from '@/components/UserDropdown'
import { isSuperAdminRole } from '@/constants/userRole'
import { useAppSelector } from '@/hooks/redux'
import { AdminPermissionKey, canAccessPermission, roleLabelForUser } from '@/lib/admin/adminPermissions'
import { getAdminThemeConfig, getThemeClasses } from '@/lib/admin/adminTheme'
import { AdminVCardListProvider } from '@/lib/admin/AdminVCardListContext'
import { logout } from '@/providers/AuthProvider'
import { cn } from '@/utils/cn'
import {
  Calendar,
  Contact,
  CreditCard,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  Lock,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  Package,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'

type NavItem = {
  id: string
  label: string
  icon: React.ElementType
  permission: AdminPermissionKey
}

const adminNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { id: 'mycards', label: 'My Cards', icon: CreditCard, permission: 'mycards' },
  { id: 'vcards', label: 'vCards', icon: Contact, permission: 'vcards' },
  { id: 'users', label: 'Users', icon: Users, permission: 'users' },
  { id: 'leads', label: 'Leads Management', icon: Users, permission: 'leads' },
  { id: 'support', label: 'Support Tickets', icon: LifeBuoy, permission: 'support' },
  { id: 'announcements', label: 'Global Announcement', icon: Megaphone, permission: 'announcements' },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, permission: 'templates' },
  { id: 'packages', label: 'Packages & Upgrades', icon: Package, permission: 'packages' },
  { id: 'schedule', label: 'Schedules', icon: Calendar, permission: 'schedule' },
  { id: 'team', label: 'Admin Team', icon: ShieldCheck, permission: 'team' },
  { id: 'audit', label: 'System Audits', icon: FileText, permission: 'audit' },
]

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

function segmentFromPath(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  const idx = parts.indexOf('admin')
  return idx >= 0 ? parts[idx + 1] || 'dashboard' : 'dashboard'
}

function titleFromSegment(segment: string) {
  if (segment === 'dashboard') return 'Overview'
  return segment.replace(/-/g, ' ')
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const activeTab = segmentFromPath(pathname)
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null)
  const isMobileMenuOpen = mobileMenuPath === pathname
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isDarkMode = useSyncExternalStore(subscribeToTheme, getDarkModeSnapshot, getServerDarkModeSnapshot)
  const authUser = useAppSelector((state) => state.user.user)
  const accessContext = {
    role: authUser?.role,
    staffRole: authUser?.staffRole,
    allowedModules: authUser?.allowedModules,
  }
  const [themeConfig, setThemeConfig] = useState(() => getAdminThemeConfig())

  useEffect(() => {
    const handleThemeConfigChange = () => setThemeConfig(getAdminThemeConfig())
    window.addEventListener('admin_theme_change', handleThemeConfigChange)
    return () => window.removeEventListener('admin_theme_change', handleThemeConfigChange)
  }, [])

  useEffect(() => {
    // Drop legacy demo RBAC keys from the old Super Admin toggle.
    localStorage.removeItem('is_super_admin')
    localStorage.removeItem('vbiz_admin_team')
    localStorage.removeItem('vbiz_active_admin_role')
  }, [])

  useEffect(() => {
    if (!isMobileMenuOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuPath(null)
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileMenuOpen])

  const themeClasses = getThemeClasses(themeConfig.accent)
  const canAccess = (permission: AdminPermissionKey) => canAccessPermission(permission, accessContext)
  const navItems = adminNavItems.filter((item) => canAccess(item.permission))
  const activeRoleLabel = roleLabelForUser(accessContext)
  const accessDenied = !canAccess(activeTab as AdminPermissionKey) && activeTab !== 'settings'

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

  const renderBody = () => {
    if (accessDenied) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
          <Lock className="mb-3 h-8 w-8 text-rose-500" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Access restricted</h3>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            Your admin role ({activeRoleLabel}) does not include this module.
            {isSuperAdminRole(authUser?.role) ? '' : ' Ask a Super Admin to update permissions in Admin Team.'}
          </p>
        </div>
      )
    }

    if (activeTab === 'settings' && !canAccess('settings')) return null
    return children
  }

  const closeMobileMenu = () => setMobileMenuPath(null)

  const navLink = (item: NavItem, mobile = false) => {
    const href = `/admin/${item.id}`
    const isActive = activeTab === item.id
    return (
      <Link
        key={item.id}
        href={href}
        onClick={() => {
          if (mobile) closeMobileMenu()
        }}
        className={cn(
          'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200',
          isActive
            ? cn(themeClasses.lightBg, themeClasses.lightText, 'shadow-sm')
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
          <span>{item.label}</span>
        </div>
      </Link>
    )
  }

  const renderSidebar = ({ mobile = false }: { mobile?: boolean } = {}) => (
    <>
      <div
        className={cn(
          'flex h-20 shrink-0 items-center border-b border-slate-100 px-6 dark:border-white/5',
          mobile && 'justify-between'
        )}
      >
        <Link
          href="/admin/dashboard"
          className="group flex items-center gap-2"
          onClick={() => {
            if (mobile) closeMobileMenu()
          }}
        >
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl font-black text-white shadow-md transition-transform group-hover:scale-105',
              themeClasses.bg,
              themeClasses.shadow
            )}
          >
            {themeConfig.appName?.[0]?.toUpperCase() || 'V'}
          </div>
          <div>
            <span className="block text-xl leading-none font-black tracking-tight text-slate-900 dark:text-white">
              {themeConfig.appName}
            </span>
            <span className={cn('mt-0.5 block text-[10px] font-bold tracking-widest uppercase', themeClasses.text)}>
              {themeConfig.subTitle}
            </span>
          </div>
        </Link>
        {mobile && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMobileMenu}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-4">{navItems.map((item) => navLink(item, mobile))}</div>

      <div className="shrink-0 space-y-1 border-t border-slate-100 p-4 dark:border-white/5">
        {canAccess('settings') && (
          <Link
            href="/admin/settings"
            onClick={() => {
              if (mobile) closeMobileMenu()
            }}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200',
              activeTab === 'settings'
                ? cn(themeClasses.lightBg, themeClasses.lightText, 'shadow-sm')
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
            )}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            if (mobile) closeMobileMenu()
            setShowLogoutModal(true)
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-500 transition-all hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
        >
          <LogOut className="h-5 w-5" />
          <span>Log Out</span>
        </button>
      </div>
    </>
  )

  return (
    <AdminVCardListProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-indigo-500/30 dark:bg-[#070a13] dark:text-slate-100">
        <aside className="z-20 hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-all lg:flex dark:border-white/10 dark:bg-[#0b0f19]">
          {renderSidebar()}
        </aside>

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-[#070a13]">
          <header className="z-10 flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white/70 px-6 backdrop-blur-xl lg:px-10 dark:border-white/10 dark:bg-[#0b0f19]/70">
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Open menu"
                aria-expanded={isMobileMenuOpen}
                onClick={() => setMobileMenuPath(isMobileMenuOpen ? null : pathname)}
                className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:hover:bg-white/10 dark:hover:text-white"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="hidden text-xl font-black text-slate-900 capitalize sm:block dark:text-white">
                {titleFromSegment(activeTab)}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <NotificationCenter audience="admin" title="Admin Alerts" />

              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-xl border border-transparent p-2.5 text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:border-white/10 dark:hover:bg-white/5 dark:hover:text-white"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block dark:bg-white/10" />

              <UserDropdown />
            </div>
          </header>

          <main className="relative z-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-multiply dark:mix-blend-overlay" />
            {renderBody()}
          </main>
        </div>

        {isMobileMenuOpen && (
          <ModalPortal>
            <div className="fixed inset-0 z-200 flex lg:hidden">
              <div
                className="animate-in fade-in fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={closeMobileMenu}
              />
              <aside className="animate-in slide-in-from-left relative z-10 flex h-full w-64 flex-col bg-white shadow-2xl dark:bg-[#0b0f19]">
                {renderSidebar({ mobile: true })}
              </aside>
            </div>
          </ModalPortal>
        )}

        {showLogoutModal && (
          <LogoutConfirmModal
            onCancel={() => setShowLogoutModal(false)}
            onConfirm={handleLogout}
            isLoading={isLoggingOut}
          />
        )}
      </div>
    </AdminVCardListProvider>
  )
}
