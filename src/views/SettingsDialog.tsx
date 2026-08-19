'use client'

import { CanvaConnectRow } from '@/components/canva'
import { LogoutConfirmModal } from '@/components/LogoutConfirmModal'
import { BillingPackagesModal } from '@/components/settings/BillingPackagesModal'
import ChangePasswordForm from '@/components/settings/ChangePasswordForm'
import SetPasswordForm from '@/components/settings/SetPasswordForm'
import { Button, Input, Switch, Textarea } from '@/components/ui'
import { useDashboardTour } from '@/context/DashboardTourContext'
import { useAppSelector } from '@/hooks/redux'
import { useAccountStatus } from '@/hooks/useAccountStatus'
import { usePackageAccess } from '@/hooks/usePackageAccess'
import { ACCOUNT_SUSPENDED_MESSAGE } from '@/lib/accountStatus'
import { getNotificationPrefs, saveNotificationPrefs, type NotificationPrefs } from '@/lib/notifications'
import { PACKAGE_FEATURE_LOCKED_MESSAGE } from '@/lib/packageAccess'
import { useTheme } from '@/lib/ThemeProvider'
import { logout, useAuth } from '@/providers/AuthProvider'
import {
  useGetPackagesQuery,
  useGetSubscriptionsQuery,
  type OwnerPackage,
  type OwnerSubscription,
} from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Bell,
  Key,
  Layers,
  LogOut,
  Megaphone,
  Menu,
  Palette,
  Settings,
  Shield,
  User,
} from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type MouseEventHandler, type ReactNode } from 'react'

function isActiveSubscription(sub: OwnerSubscription, now = Date.now()) {
  if (sub.provider === 'stripe') {
    const status = String(sub.stripeStatus || '').toLowerCase()
    if (status !== 'active' && status !== 'trialing') return false
  }
  if (sub.endsAt == null || sub.endsAt === '') return true
  const ends = new Date(sub.endsAt).getTime()
  return Number.isFinite(ends) && ends > now
}

function formatPackagePrice(monthlyPrice?: number | null) {
  return `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((Number(monthlyPrice) || 0) / 100)}/mo`
}

function formatCardLimit(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return null
  return n === 1 ? '1 card' : `${n} cards`
}

function packageMaxCards(pkg: OwnerPackage | null | undefined) {
  const value = pkg?.features?.find((f) => f.featureKey === 'max_cards')?.featureValue
  if (value == null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return formatCardLimit(n)
}

const sectionsGroups = [
  {
    groupName: 'Personal',
    items: [
      { id: 'profile', label: 'My Profile', icon: User },
      { id: 'security', label: 'Security', icon: Shield },
      { id: 'billing', label: 'Billing', icon: Key },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    groupName: 'Dashboard',
    items: [{ id: 'appearance', label: 'Appearance', icon: Palette }],
  },
  {
    groupName: 'Growth',
    items: [{ id: 'integrations', label: 'Integrations', icon: Layers }],
  },
  {
    groupName: 'Banners',
    items: [
      { id: 'support', label: 'Support', icon: Megaphone },
      { id: 'sensitive', label: 'Sensitive', icon: AlertTriangle },
    ],
  },
]

type TabButtonProps = {
  active: boolean
  icon: LucideIcon
  label: string
  onClick: MouseEventHandler<HTMLButtonElement>
  isCollapsed: boolean
  tourId?: string
}

function TabButton({ active, icon: Icon, label, onClick, isCollapsed, tourId }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      id={tourId}
      data-tour-id={tourId}
      className={cn(
        'group relative flex w-full items-center gap-3.5 overflow-hidden rounded-2xl px-4 py-3 text-[13.5px] font-bold transition-all',
        active
          ? 'bg-slate-900 text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] dark:bg-white dark:text-slate-900 dark:shadow-[0_8px_20px_-6px_rgba(255,255,255,0.3)]'
          : 'border border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white',
        isCollapsed ? 'mx-auto h-12 w-12 justify-center rounded-[14px] px-0 lg:mx-auto' : ''
      )}
      title={isCollapsed ? label : undefined}
    >
      <Icon
        className={cn('h-5 w-5 shrink-0 transition-all duration-300', active ? 'scale-105' : 'group-hover:scale-110')}
      />
      <span
        className={cn(
          'font-bold tracking-wide whitespace-nowrap transition-all duration-300',
          isCollapsed ? 'w-0 opacity-0 lg:hidden' : 'opacity-100'
        )}
      >
        {label}
      </span>
      {active && !isCollapsed && (
        <span className="absolute right-3 h-1.5 w-1.5 animate-pulse rounded-full bg-white/50 dark:bg-slate-900/50" />
      )}
    </button>
  )
}

type SectionProps = {
  id: string
  title: string
  children: ReactNode
  active: boolean
}

function Section({ id, title, children, active }: SectionProps) {
  if (!active) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      id={id}
      className="min-w-0 scroll-mt-28 space-y-6"
    >
      <div className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-3xl sm:rounded-[28px] lg:rounded-4xl dark:border-white/10 dark:bg-[#070a13]/70 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        <div className="relative p-5 sm:p-6 md:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent dark:via-white/10" />

          <div className="mb-6 flex items-start justify-between gap-3 sm:mb-8 sm:items-center">
            <h3 className="min-w-0 text-xl leading-tight font-black tracking-tight wrap-break-word text-slate-900 sm:text-2xl lg:text-[28px] dark:text-white">
              {title}
            </h3>
            <div className="pointer-events-none flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-slate-200/50 bg-slate-50 shadow-inner sm:h-12 sm:w-12 sm:rounded-[18px] dark:border-white/5 dark:bg-white/5">
              <Settings className="h-4 w-4 text-slate-400 opacity-50 sm:h-5 sm:w-5" />
            </div>
          </div>

          <div className="space-y-8 sm:space-y-10">{children}</div>
        </div>
      </div>
    </motion.div>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked?: boolean
  onChange?: () => void
}) {
  return (
    <label className="group flex cursor-pointer items-start justify-between gap-4 rounded-[20px] border border-transparent p-4 transition-colors hover:border-slate-200/50 hover:bg-slate-50/50 sm:items-center dark:hover:border-white/5 dark:hover:bg-white/2">
      <div className="flex-1">
        <h4 className="mb-0.5 text-[14px] font-bold text-slate-900 dark:text-white">{title}</h4>
        <p className="text-[13px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <Switch checked={Boolean(checked)} onChange={onChange} />
    </label>
  )
}

export default function SettingsDialog() {
  const { user } = useAuth()
  const reduxUser = useAppSelector((state) => state.user.user)
  const { isSuspended, canPerformAccountActions } = useAccountStatus()
  const {
    entitlements,
    allow_canva: canUseCanva,
    allow_push_notification: canUsePush,
    allow_email_notification: canUseEmail,
  } = usePackageAccess()
  const router = useRouter()
  const { accentColor, setAccentColor } = useTheme()
  const [selectedTab, setSelectedTab] = useState('profile')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [billingPackagesOpen, setBillingPackagesOpen] = useState(false)
  const { isActive: isTourActive, settingsAssist, currentStep } = useDashboardTour()
  const hasPassword = reduxUser?.hasPassword !== false
  const { data: packages = [] } = useGetPackagesQuery(undefined, { skip: isSuspended })
  const { data: subscriptions = [] } = useGetSubscriptionsQuery(undefined, { skip: isSuspended })

  const activeSubscription = subscriptions.find((sub) => isActiveSubscription(sub))
  const currentPackage =
    activeSubscription?.package ??
    (activeSubscription?.packageId ? packages.find((pkg) => pkg.id === activeSubscription.packageId) : undefined) ??
    null
  const hasActivePlan = Boolean(entitlements?.subscriptionActive || currentPackage)
  const currentPlanName = entitlements?.packageName || currentPackage?.name || null
  const currentPlanCards = formatCardLimit(entitlements?.limits.maxCards) ?? packageMaxCards(currentPackage)

  const activeTab = isTourActive && currentStep?.id && settingsAssist.activeTab ? settingsAssist.activeTab : selectedTab

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    'dark-mode': document.documentElement.classList.contains('dark'),
    'show-followers': false,
    'social-analysis': true,
    'publish-shop': false,
    'main-tab-shop': false,
    'support-banner': false,
    'sensitive-warning': false,
    'subscribe-btn': true,
  })
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(() => getNotificationPrefs())

  const toggle = (key: string) => setToggles((p) => ({ ...p, [key]: !p[key] }))
  const patchNotif = (patch: Partial<NotificationPrefs>) => {
    setNotifPrefs(saveNotificationPrefs(patch))
  }

  useEffect(() => {
    // Scroll spy logic removed in favor of content swapping
  }, [activeTab])

  useEffect(() => {
    const handleThemeChange = () => {
      setToggles((p) => ({
        ...p,
        'dark-mode': document.documentElement.classList.contains('dark'),
      }))
    }
    window.addEventListener('theme-change', handleThemeChange)
    return () => window.removeEventListener('theme-change', handleThemeChange)
  }, [])

  // Removed scrollToSection in favor of content swapping

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
    <div className="relative min-h-screen w-full min-w-0 overflow-x-hidden" data-tour-settings-scope>
      <div className="bg-primary-600/10 pointer-events-none absolute top-20 left-1/2 h-100 w-full max-w-200 -translate-x-1/2 rounded-full blur-[150px]" />
      <div className="relative z-10 mx-auto w-full max-w-275 min-w-0 pt-6 pb-16 sm:pt-8 sm:pb-20 lg:pt-10">
        <div className="mb-8 flex items-start gap-3 sm:mb-10 sm:gap-4 lg:mb-14 lg:gap-5">
          <div className="bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm sm:h-14 sm:w-14 sm:rounded-[18px] lg:h-16 lg:w-16 lg:rounded-[20px]">
            <div className="from-primary-500/10 pointer-events-none absolute inset-0 rounded-[inherit] bg-linear-to-tr to-transparent" />
            <Settings className="text-primary-600 dark:text-primary-400 h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl leading-tight font-black tracking-tight wrap-break-word text-slate-900 sm:text-2xl md:text-[28px] lg:text-[32px] dark:text-white">
              Account Settings
            </h2>
            <p className="mt-1 text-[13px] leading-snug font-medium text-slate-500 sm:text-[14px] lg:text-[15px] dark:text-slate-400">
              Manage your profile, preferences, and integrations.
            </p>
            {isSuspended ? (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                {ACCOUNT_SUSPENDED_MESSAGE}
              </p>
            ) : null}
          </div>
        </div>

        <div className="relative flex w-full min-w-0 flex-col items-stretch gap-6 sm:gap-8 lg:flex-row lg:items-start lg:gap-10 xl:gap-14">
          {/* Sidebar Nav */}
          <div
            className={cn(
              'no-scrollbar max-h-none w-full min-w-0 space-y-1.5 overflow-y-auto rounded-3xl border border-slate-200/80 bg-white/70 pb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-3xl transition-all duration-400 ease-[0.23,1,0.32,1] sm:rounded-[28px] sm:pb-8 lg:sticky lg:top-28 lg:max-h-[calc(100vh-140px)] lg:shrink-0 lg:rounded-4xl lg:pb-10 dark:border-white/10 dark:bg-[#070a13]/70 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]',
              isSidebarCollapsed ? 'p-2 lg:w-21 lg:p-3' : 'p-4 sm:p-5 lg:w-65 xl:w-70'
            )}
          >
            <div
              className={cn(
                'mt-1 mb-3 flex items-center px-4',
                isSidebarCollapsed ? 'justify-center lg:px-2' : 'justify-between'
              )}
            >
              <h3
                className={cn(
                  'text-[11px] font-black tracking-[0.2em] whitespace-nowrap text-slate-500 uppercase transition-all duration-300 dark:text-slate-400',
                  isSidebarCollapsed ? 'hidden' : 'opacity-100'
                )}
              >
                Settings
              </h3>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden cursor-pointer rounded-2xl p-2 text-slate-500 transition-colors hover:bg-slate-200/50 lg:flex dark:bg-white/5 dark:hover:bg-white/10"
                aria-label={isSidebarCollapsed ? 'Expand settings sidebar' : 'Collapse settings sidebar'}
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6">
              {sectionsGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1.5">
                  <h4
                    className={cn(
                      'mb-2 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500',
                      isSidebarCollapsed ? 'mx-auto hidden text-center' : 'block'
                    )}
                  >
                    {group.groupName}
                  </h4>
                  {group.items.map((s) => (
                    <TabButton
                      key={s.id}
                      active={activeTab === s.id}
                      icon={s.icon}
                      label={s.label}
                      onClick={() => setSelectedTab(s.id)}
                      isCollapsed={isSidebarCollapsed}
                      tourId={s.id === 'appearance' ? 'tour-account-dashboard-appearance' : undefined}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="mx-2 my-3 h-px bg-slate-200/60 sm:my-6 dark:bg-white/10"></div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className={cn(
                'group flex w-full items-center overflow-hidden rounded-2xl border border-transparent px-4 py-3.5 text-[13.5px] font-bold text-red-500 transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400',
                isSidebarCollapsed ? 'mx-auto h-12 w-12 justify-center rounded-[18px] px-0' : 'gap-3'
              )}
              title={isSidebarCollapsed ? 'Log Out' : undefined}
            >
              <LogOut className="h-4.5 w-4.5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
              <span
                className={cn(
                  'font-semibold whitespace-nowrap transition-all duration-300',
                  isSidebarCollapsed ? 'w-0 opacity-0 lg:hidden' : 'opacity-100'
                )}
              >
                Log Out
              </span>
            </button>
          </div>

          {/* Content Area */}
          <div className="w-full min-w-0 flex-1 space-y-8 pb-20 sm:space-y-10 sm:pb-24 lg:space-y-12 lg:pb-32">
            <Section id="profile" active={activeTab === 'profile'} title="My Profile">
              <div className="flex w-full min-w-0 flex-col items-start gap-5 rounded-[20px] border border-slate-200/50 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:gap-6 sm:rounded-3xl sm:p-6 dark:border-white/5 dark:bg-white/2">
                <div className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f19]">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="Avatar"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      width={100}
                      height={100}
                    />
                  ) : (
                    <User className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                  )}
                  <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-900/40 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                    <span className="text-[11px] font-bold tracking-wider text-white uppercase">Change</span>
                  </div>
                </div>
                <div className="w-full min-w-0 sm:flex-1">
                  <h4 className="mb-1 truncate text-lg leading-tight font-black tracking-tight text-slate-900 sm:text-[20px] dark:text-white">
                    {user?.displayName || 'User'}
                  </h4>
                  <p className="mb-4 truncate text-[13px] font-medium text-slate-500 sm:text-[14px] dark:text-slate-400">
                    {user?.email}
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <Button type="button" variant="secondary" size="sm" className="h-10 px-4 font-bold sm:px-5">
                      Upload new
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 px-4 font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 sm:px-5 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="group min-w-0 space-y-2">
                    <label className="group-focus-within:text-primary-500 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors dark:text-slate-400">
                      Display Name
                    </label>
                    <Input type="text" defaultValue={user?.displayName || ''} placeholder="Jane Doe" />
                  </div>
                  <div className="group min-w-0 space-y-2">
                    <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                      Email Address
                    </label>
                    <div className="relative min-w-0">
                      <Input
                        type="email"
                        defaultValue={user?.email || ''}
                        readOnly
                        className="cursor-not-allowed truncate bg-slate-100 pr-22 opacity-60 sm:pr-28 dark:bg-slate-800/50"
                      />
                      <span className="pointer-events-none absolute top-1/2 right-2 max-w-[40%] -translate-y-1/2 truncate rounded-md bg-slate-200 px-1.5 py-1 text-[9px] font-bold tracking-wider text-slate-500 uppercase sm:right-3 sm:max-w-none sm:px-2 sm:text-[10px] sm:tracking-widest dark:bg-slate-700 dark:text-slate-400">
                        Read Only
                      </span>
                    </div>
                  </div>
                </div>
                <div className="group space-y-2">
                  <label className="group-focus-within:text-primary-500 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors dark:text-slate-400">
                    Location
                  </label>
                  <Input type="text" defaultValue="San Francisco, CA" placeholder="e.g. San Francisco, CA" />
                </div>
                <div className="group space-y-2">
                  <label className="group-focus-within:text-primary-500 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors dark:text-slate-400">
                    Bio
                  </label>
                  <Textarea placeholder="Write a short bio about yourself..." className="min-h-30 resize-none" />
                  <p className="pr-2 text-right text-[12px] text-slate-400">Max 160 characters</p>
                </div>
              </div>

              <div className="flex border-t border-slate-200/50 pt-4 sm:justify-end dark:border-white/5">
                <Button type="button" variant="dark" size="lg" className="w-full px-8 font-bold sm:w-auto">
                  Save Changes
                </Button>
              </div>
            </Section>

            <Section id="appearance" active={activeTab === 'appearance'} title="Dashboard appearance">
              <p className="mb-6 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                These settings affect your private dashboard and back office only — not your public vCards. Customize
                each vCard under Card settings → Template Settings in the editor.
              </p>
              <div className="space-y-6">
                <ToggleRow
                  title="Dark mode"
                  description="Toggle between light and dark visual themes for this dashboard."
                  checked={toggles['dark-mode']}
                  onChange={() => {
                    const isNowDark = !toggles['dark-mode']
                    toggle('dark-mode')
                    if (isNowDark) {
                      document.documentElement.classList.add('dark')
                      localStorage.setItem('theme', 'dark')
                    } else {
                      document.documentElement.classList.remove('dark')
                      localStorage.setItem('theme', 'light')
                    }
                    window.dispatchEvent(new Event('theme-change'))
                  }}
                />
              </div>

              <div className="my-8 h-px w-full bg-slate-200/50 dark:bg-white/5"></div>
              <div>
                <h4 className="mb-2 text-[15px] font-black text-slate-900 dark:text-white">Dashboard Accent</h4>
                <p className="mb-6 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                  Select a primary accent color specifically for your private application dashboard.
                </p>
                <div className="flex w-full flex-wrap items-center gap-4 rounded-3xl border border-slate-200/50 bg-slate-50/50 p-4 dark:border-white/5 dark:bg-white/2">
                  {(['indigo', 'emerald', 'amber', 'rose', 'sky'] as const).map((color) => (
                    <button
                      key={color}
                      onClick={() => setAccentColor(color)}
                      className={cn(
                        'flex h-12 w-12 max-w-20 min-w-15 flex-1 items-center justify-center rounded-2xl transition-all',
                        accentColor === color
                          ? 'ring-primary-500 z-10 scale-110 shadow-lg ring-2 ring-offset-2 dark:ring-offset-[#0b0f19]'
                          : 'opacity-80 hover:scale-105 hover:opacity-100',
                        color === 'indigo' && 'bg-[#6366f1]',
                        color === 'emerald' && 'bg-[#10b981]',
                        color === 'amber' && 'bg-[#f59e0b]',
                        color === 'rose' && 'bg-[#f43f5e]',
                        color === 'sky' && 'bg-[#0ea5e9]'
                      )}
                    >
                      {accentColor === color && (
                        <div className="h-5 w-5 rounded-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            <Section id="notifications" active={activeTab === 'notifications'} title="Notifications">
              <div className="space-y-4">
                <ToggleRow
                  title="Browser push alerts"
                  description={
                    canUsePush
                      ? 'Show OS notifications when this tab is open or in the background.'
                      : PACKAGE_FEATURE_LOCKED_MESSAGE
                  }
                  checked={canUsePush && notifPrefs.browserPush}
                  onChange={() => {
                    if (!canUsePush) return
                    patchNotif({ browserPush: !notifPrefs.browserPush })
                  }}
                />
                <ToggleRow
                  title="Contact saves"
                  description="Alert when a guest shares contact details on your vCard."
                  checked={notifPrefs.contactSaves}
                  onChange={() => patchNotif({ contactSaves: !notifPrefs.contactSaves })}
                />
                <ToggleRow
                  title="Notes & urgent replies"
                  description="Alert when notes are saved or replies are sent."
                  checked={notifPrefs.notesReplies}
                  onChange={() => patchNotif({ notesReplies: !notifPrefs.notesReplies })}
                />
                <ToggleRow
                  title="Weekly insights"
                  description="Once-per-week engagement summary in your alert inbox."
                  checked={notifPrefs.weeklyInsight}
                  onChange={() => patchNotif({ weeklyInsight: !notifPrefs.weeklyInsight })}
                />
                <ToggleRow
                  title="Call & email taps"
                  description="Notify when visitors tap call or email on your public vCard."
                  checked={notifPrefs.callEmail}
                  onChange={() => patchNotif({ callEmail: !notifPrefs.callEmail })}
                />
                <ToggleRow
                  title="Support & feedback"
                  description="Alerts about support tickets and feedback updates."
                  checked={notifPrefs.supportFeedback}
                  onChange={() => patchNotif({ supportFeedback: !notifPrefs.supportFeedback })}
                />
                <ToggleRow
                  title="Email notifications"
                  description={
                    canUseEmail
                      ? 'Receive email summaries of activity and audience insights.'
                      : PACKAGE_FEATURE_LOCKED_MESSAGE
                  }
                  checked={canUseEmail && notifPrefs.emailNotifications}
                  onChange={() => {
                    if (!canUseEmail) return
                    patchNotif({ emailNotifications: !notifPrefs.emailNotifications })
                  }}
                />
                <ToggleRow
                  title="Security alerts"
                  description="Get notified about unrecognized logins or password changes."
                  checked={notifPrefs.securityAlerts}
                  onChange={() => patchNotif({ securityAlerts: !notifPrefs.securityAlerts })}
                />
                <ToggleRow
                  title="Product updates"
                  description="Stay in the loop with the latest features and announcements."
                  checked={notifPrefs.productUpdates}
                  onChange={() => patchNotif({ productUpdates: !notifPrefs.productUpdates })}
                />
              </div>
            </Section>

            <Section id="security" active={activeTab === 'security'} title="Security">
              <div className="space-y-8">
                <div className="space-y-6 rounded-3xl border border-slate-200/50 bg-slate-50/50 p-4 sm:p-6 dark:border-white/5 dark:bg-white/2">
                  {!canPerformAccountActions ? (
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {ACCOUNT_SUSPENDED_MESSAGE}
                    </p>
                  ) : hasPassword ? (
                    <ChangePasswordForm email={user?.email ?? null} />
                  ) : (
                    <SetPasswordForm email={user?.email ?? null} provider={reduxUser?.provider} />
                  )}
                </div>
              </div>
            </Section>

            <Section id="integrations" active={activeTab === 'integrations'} title="Integrations">
              <div className="space-y-12">
                {/* <div>
                  <h4 className="text-[15px] font-black text-slate-900 dark:text-white mb-2">
                    Social media
                  </h4>
                  <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
                    Display your social content, compare your analytics, create
                    shoppable posts, and auto-reply to comments.
                  </p>
                  <div className="space-y-3 mb-8">
                    <ConnectRow
                      icon={Instagram}
                      title="Instagram"
                      iconStyle="bg-pink-50 dark:bg-pink-500/10 border-pink-100 dark:border-pink-500/20"
                      color="text-pink-600 dark:text-pink-400"
                    />
                    <ConnectRow
                      icon={PlaySquare}
                      title="TikTok"
                      iconStyle="bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/20"
                      color="text-slate-900 dark:text-white"
                    />
                    <ConnectRow
                      icon={Youtube}
                      title="YouTube"
                      iconStyle="bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20"
                      color="text-red-600 dark:text-red-400"
                    />
                  </div>
                  <div className="space-y-4">
                    <ToggleRow
                      title="Show total followers"
                      description="Display your total follower count across Instagram, TikTok, and YouTube below your profile image."
                      checked={toggles["show-followers"]}
                      onChange={() => toggle("show-followers")}
                    />
                    <ToggleRow
                      title="Social content analysis"
                      description="Use connected social content and metrics to analyze engagement and generate AI insights."
                      checked={toggles["social-analysis"]}
                      onChange={() => toggle("social-analysis")}
                    />
                  </div>
                </div>

                <div className="h-px w-full bg-slate-200/50 dark:bg-white/5"></div>

                <div>
                  <h4 className="text-[15px] font-black text-slate-900 dark:text-white mb-2">
                    Mailing list
                  </h4>
                  <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
                    Sync your Audience to your favorite tools to send
                    newsletters and promotions.
                  </p>
                  <div className="space-y-3">
                    <ConnectRow
                      icon={Mailbox}
                      title="Mailchimp"
                      iconStyle="bg-yellow-50 dark:bg-yellow-500/10 border-yellow-100 dark:border-yellow-500/20"
                      color="text-yellow-600 dark:text-yellow-400"
                    />
                    <ConnectRow
                      icon={Layers}
                      title="Klaviyo"
                      iconStyle="bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20"
                      color="text-red-500 dark:text-red-400"
                    />
                    <ConnectRow
                      icon={Database}
                      title="Google Sheets"
                      iconStyle="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"
                      color="text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                </div>

                <div className="h-px w-full bg-slate-200/50 dark:bg-white/5"></div> */}

                <div>
                  <h4 className="mb-2 text-[15px] font-black text-slate-900 dark:text-white">Design tools</h4>
                  <p className="mb-6 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                    Connect Canva for creatives.
                  </p>
                  {canUseCanva ? (
                    <CanvaConnectRow userId={user?.uid} variant="card" returnTo="/settings" />
                  ) : (
                    <p className="text-sm font-semibold text-slate-500">{PACKAGE_FEATURE_LOCKED_MESSAGE}</p>
                  )}
                </div>
              </div>
            </Section>

            <Section id="earn" active={activeTab === 'earn'} title="Earn">
              <div className="space-y-10">
                <div>
                  <h4 className="mb-3 text-[15px] font-black text-slate-900 dark:text-white">Shop</h4>
                  <p className="mb-6 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                    Manage how your Shop tab appears on your profile.
                  </p>
                  <div className="space-y-4">
                    <ToggleRow
                      title="Publish Shop"
                      description="Have your Shop tab visible on your profile."
                      checked={toggles['publish-shop']}
                      onChange={() => toggle('publish-shop')}
                    />
                    <ToggleRow
                      title="Set Shop as main tab"
                      description="When visitors arrive on your profile, they'll see your Shop first."
                      checked={toggles['main-tab-shop']}
                      onChange={() => toggle('main-tab-shop')}
                    />
                  </div>
                </div>
              </div>
            </Section>

            <Section id="support" active={activeTab === 'support'} title="Support Banner">
              <ToggleRow
                title="Show your support"
                description="Show your support for important causes with a profile banner. Only one banner can be active at a time."
                checked={toggles['support-banner']}
                onChange={() => toggle('support-banner')}
              />
            </Section>

            <Section id="sensitive" active={activeTab === 'sensitive'} title="Sensitive Material">
              <ToggleRow
                title="Sensitive material"
                description="Display a sensitive content warning before visitors can view your profile."
                checked={toggles['sensitive-warning']}
                onChange={() => toggle('sensitive-warning')}
              />
            </Section>

            <Section id="subscribe" active={activeTab === 'subscribe'} title="Subscribe">
              <div className="space-y-8">
                <ToggleRow
                  title="Let visitors subscribe"
                  description="Add a button so visitors can subscribe to your profile. Turning off this feature will not affect your current subscriber count."
                  checked={toggles['subscribe-btn']}
                  onChange={() => toggle('subscribe-btn')}
                />
                <button className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200/80 bg-white px-6 py-3 text-[13px] font-bold text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-95 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
                  See subscriber insights
                </button>
              </div>
            </Section>

            <Section id="affiliate" active={activeTab === 'affiliate'} title="Affiliates">
              <div>
                <h4 className="mb-2 text-[15px] font-black text-slate-900 dark:text-white">Affiliate programs</h4>
                <p className="mb-6 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                  Earn commission by referring visitors to products and services from your links. Not a member of an
                  affiliate program?{' '}
                  <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
                    Learn how to get started
                  </a>
                </p>
                <button className="inline-flex items-center gap-2 rounded-[14px] bg-slate-900 px-6 py-3 text-[13px] font-bold text-white shadow-md transition-all hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                  Connect program
                </button>
                <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/10 dark:bg-amber-500/5">
                  <p className="text-[13px] leading-relaxed font-medium text-amber-800 dark:text-amber-400/80">
                    Unknown affiliate credentials are applied by default to some products. We encourage you to replace
                    them with your own credentials.{' '}
                    <a href="#" className="font-bold text-amber-900 underline dark:text-amber-300">
                      How it works
                    </a>
                  </p>
                </div>
              </div>
            </Section>

            <Section id="billing" active={activeTab === 'billing'} title="Billing & Plan">
              <div>
                <h4 className="mb-2 text-[15px] font-black text-slate-900 dark:text-white">Subscription & Billing</h4>
                <p className="mb-6 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                  View available plans and manage your subscription.
                </p>

                <div className="mb-6 rounded-2xl border border-slate-200 px-4 py-4 dark:border-white/10">
                  {hasActivePlan && (currentPackage || currentPlanName) ? (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Current plan</p>
                        <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                          {currentPlanName || currentPackage?.name}
                        </p>
                        {currentPackage?.description ? (
                          <p className="mt-1 line-clamp-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                            {currentPackage.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {currentPackage ? formatPackagePrice(currentPackage.monthlyPrice) : null}
                        </p>
                        {currentPlanCards ? (
                          <p className="mt-1 text-[12px] font-medium text-slate-400">{currentPlanCards}</p>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Current plan</p>
                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">No active plan</p>
                      <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                        Upgrade to unlock more cards and features for your account.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setBillingPackagesOpen(true)}
                  className="w-full rounded-2xl bg-slate-900 py-3 text-[14px] font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98] sm:w-auto sm:px-6 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {hasActivePlan ? 'Manage Package' : 'Upgrade Plan'}
                </button>
              </div>
            </Section>
          </div>
        </div>

        {showLogoutModal && (
          <LogoutConfirmModal
            onCancel={() => setShowLogoutModal(false)}
            onConfirm={handleLogout}
            isLoading={isLoggingOut}
          />
        )}

        <BillingPackagesModal
          open={billingPackagesOpen}
          onClose={() => setBillingPackagesOpen(false)}
          packages={packages}
          currentPackageId={currentPackage?.id}
        />
      </div>
    </div>
  )
}
