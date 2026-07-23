'use client'

import { logout, useAuth } from '@/components/Auth'
import { CanvaConnectRow } from '@/components/canva'
import { LogoutConfirmModal } from '@/components/LogoutConfirmModal'
import { ModalPortal } from '@/components/ModalPortal'
import { useDashboardTour } from '@/context/DashboardTourContext'
import { useTheme } from '@/lib/ThemeProvider'
import { cn } from '@/utils/cn'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  BarChart2,
  Bell,
  Bot,
  ChevronRight,
  FileText,
  Key,
  Layers,
  LogOut,
  Megaphone,
  Menu,
  Palette,
  Search,
  Settings,
  Shield,
  Upload,
  User,
  X,
} from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type MouseEventHandler, type ReactNode } from 'react'

const inputClasses =
  'w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[14px] px-4 py-3.5 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm'

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
    items: [
      { id: 'integrations', label: 'Integrations', icon: Layers },
      { id: 'analytics', label: 'Analytics', icon: BarChart2 },
      { id: 'seo', label: 'SEO', icon: Search },
    ],
  },
  // {
  //   groupName: "Monetization",
  //   items: [
  //     { id: "earn", label: "Earn", icon: DollarSign },
  //     { id: "affiliate", label: "Affiliates", icon: Briefcase },
  //     { id: "subscribe", label: "Subscribe", icon: Mail },
  //   ]
  // },
  {
    groupName: 'Banners',
    items: [
      { id: 'support', label: 'Support', icon: Megaphone },
      { id: 'sensitive', label: 'Sensitive', icon: AlertTriangle },
    ],
  },
]

const LIVE_AGENT_ACCEPT = '.pdf,.txt,application/pdf,text/plain'

function LiveAgentSettingsModal({ onClose, onConnect }: { onClose: () => void; onConnect: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [businessTitle, setBusinessTitle] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')

  const handleFileChange = (files: FileList | null) => {
    const selected = files?.[0]
    if (!selected) return
    const ext = selected.name.split('.').pop()?.toLowerCase()
    if (ext !== 'pdf' && ext !== 'txt') return
    setFile(selected)
  }

  const clearFile = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleConnect = () => {
    onConnect()
    onClose()
  }

  return (
    <div className="animate-in fade-in fixed inset-0 z-200 flex items-center justify-center bg-slate-400/20 p-4 backdrop-blur-sm duration-200 dark:bg-black/60">
      <div className="animate-in zoom-in-95 relative max-h-[min(90vh,100dvh)] w-full max-w-[440px] overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl duration-300 sm:p-8 dark:border-white/10 dark:bg-[#0b0f19]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full bg-slate-200 p-2 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/10"
        >
          <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </button>

        <div className="text-center">
          <div className="from-primary-500 to-primary-700 mx-auto mb-6 h-20 w-20 rounded-[24px] bg-linear-to-tr p-[2px] shadow-[0_0_30px_rgba(59,130,246,0.25)]">
            <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-white dark:bg-[#0b0f19]">
              <Bot className="text-primary-600 dark:text-primary-400 h-10 w-10" />
            </div>
          </div>

          <h3 className="mb-2 text-[22px] font-black text-slate-900 dark:text-white">Live Agent Integration</h3>
          <p className="mb-6 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
            Upload your business knowledge base and describe your business so the live agent can assist visitors.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block pl-1 text-[13px] font-bold text-slate-900 dark:text-white">
              Knowledge base file
            </label>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept={LIVE_AGENT_ACCEPT}
              onChange={(e) => handleFileChange(e.target.files)}
            />
            {file ? (
              <div className="flex items-center gap-3 rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-white/10 dark:bg-slate-800/50">
                <FileText className="text-primary-600 dark:text-primary-400 h-5 w-5 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-900 dark:text-white">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={clearFile}
                  className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="hover:border-primary-400 hover:bg-primary-50/50 dark:hover:border-primary-500/40 dark:hover:bg-primary-500/5 flex w-full flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition-all dark:border-white/15 dark:bg-white/5"
              >
                <Upload className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                <span className="text-[13px] font-bold text-slate-900 dark:text-white">Click to upload</span>
                <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">PDF or TXT only</span>
              </button>
            )}
          </div>

          <div>
            <label
              htmlFor="live-agent-business-title"
              className="mb-2 block pl-1 text-[13px] font-bold text-slate-900 dark:text-white"
            >
              Business title
            </label>
            <input
              id="live-agent-business-title"
              type="text"
              value={businessTitle}
              onChange={(e) => setBusinessTitle(e.target.value)}
              placeholder="Enter your business title"
              className={inputClasses}
            />
          </div>

          <div>
            <label
              htmlFor="live-agent-business-description"
              className="mb-2 block pl-1 text-[13px] font-bold text-slate-900 dark:text-white"
            >
              Business description
            </label>
            <textarea
              id="live-agent-business-description"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Describe your business for the live agent"
              className={inputClasses + ' min-h-[100px] resize-none'}
            />
          </div>

          <button
            type="button"
            onClick={handleConnect}
            className="w-full rounded-[16px] bg-slate-900 py-4 text-[15px] font-bold text-white transition-all hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.3)] active:scale-95 dark:bg-white dark:text-slate-900"
          >
            Connect Live Agent
          </button>
        </div>
      </div>
    </div>
  )
}

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
        'group relative flex w-full items-center gap-3.5 overflow-hidden rounded-[16px] px-4 py-3 text-[13.5px] font-bold transition-all',
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
      <div className="flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-3xl sm:rounded-[28px] lg:rounded-[32px] dark:border-white/10 dark:bg-[#070a13]/70 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
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
      <button
        type="button"
        onClick={onChange}
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full shadow-inner transition-colors',
          checked ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300',
            checked ? 'translate-x-[22px]' : 'translate-x-1'
          )}
        />
      </button>
    </label>
  )
}

type ConnectRowProps = {
  icon: LucideIcon
  title: string
  isConnected?: boolean
  color?: string
  iconStyle?: string
  onClick?: () => void
  onDisconnect?: () => void
}

function ConnectRow({ icon: Icon, title, isConnected, color, iconStyle, onClick, onDisconnect }: ConnectRowProps) {
  return (
    <div className="group flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-white p-4 font-medium shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between dark:border-white/5 dark:bg-[#0b0f19]">
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-[16px] shadow-sm transition-transform group-hover:scale-105',
            iconStyle || 'border border-slate-100 bg-slate-50 dark:border-white/5 dark:bg-white/5'
          )}
        >
          <Icon className={cn('h-5 w-5', color || 'text-slate-900 dark:text-white')} />
        </div>
        <span className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{title}</span>
      </div>
      {isConnected ? (
        <button
          onClick={onDisconnect || onClick}
          className="group/btn flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-[12px] font-bold text-emerald-600 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 active:scale-95 sm:w-auto sm:justify-start dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:border-red-500/20 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-colors group-hover/btn:bg-red-500 dark:bg-emerald-400" />
          <span className="group-hover/btn:hidden">Connected</span>
          <span className="hidden group-hover/btn:inline">Disconnect</span>
        </button>
      ) : (
        <button
          onClick={onClick}
          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-[14px] bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.3)] active:scale-95 sm:w-auto dark:bg-white dark:text-slate-900"
        >
          Connect <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export default function SettingsDialog() {
  const { user } = useAuth()
  const router = useRouter()
  const { accentColor, setAccentColor } = useTheme()
  const [selectedTab, setSelectedTab] = useState('profile')
  const [showLiveAgentModal, setShowLiveAgentModal] = useState(false)
  const [liveAgentConnected, setLiveAgentConnected] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { isActive: isTourActive, settingsAssist, currentStep } = useDashboardTour()

  const activeTab = isTourActive && currentStep?.id && settingsAssist.activeTab ? settingsAssist.activeTab : selectedTab

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    'dark-mode': document.documentElement.classList.contains('dark'),
    'email-notif': true,
    'security-alerts': true,
    'product-updates': false,
    'show-followers': false,
    'social-analysis': true,
    'publish-shop': false,
    'main-tab-shop': false,
    'support-banner': false,
    'sensitive-warning': false,
    'subscribe-btn': true,
    'utm-params': false,
    'hide-search': false,
  })

  const toggle = (key: string) => setToggles((p) => ({ ...p, [key]: !p[key] }))

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
      <div className="bg-primary-600/10 pointer-events-none absolute top-20 left-1/2 h-[400px] w-full max-w-[800px] -translate-x-1/2 rounded-full blur-[150px]" />
      <div className="relative z-10 mx-auto w-full max-w-[1100px] min-w-0 pt-6 pb-16 sm:pt-8 sm:pb-20 lg:pt-10">
        <div className="mb-8 flex items-start gap-3 sm:mb-10 sm:gap-4 lg:mb-14 lg:gap-5">
          <div className="bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border shadow-sm sm:h-14 sm:w-14 sm:rounded-[18px] lg:h-16 lg:w-16 lg:rounded-[20px]">
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
          </div>
        </div>

        <div className="relative flex w-full min-w-0 flex-col items-stretch gap-6 sm:gap-8 lg:flex-row lg:items-start lg:gap-10 xl:gap-14">
          {/* Sidebar Nav */}
          <div
            className={cn(
              'no-scrollbar max-h-none w-full min-w-0 space-y-1.5 overflow-y-auto rounded-[24px] border border-slate-200/80 bg-white/70 pb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-3xl transition-all duration-400 ease-[0.23,1,0.32,1] sm:rounded-[28px] sm:pb-8 lg:sticky lg:top-28 lg:max-h-[calc(100vh-140px)] lg:shrink-0 lg:rounded-[32px] lg:pb-10 dark:border-white/10 dark:bg-[#070a13]/70 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]',
              isSidebarCollapsed ? 'p-2 lg:w-[84px] lg:p-3' : 'p-4 sm:p-5 lg:w-[260px] xl:w-[280px]'
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
              title={isSidebarCollapsed ? 'Sign Out' : undefined}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0 transition-transform group-hover:-translate-x-0.5" />
              <span
                className={cn(
                  'font-semibold whitespace-nowrap transition-all duration-300',
                  isSidebarCollapsed ? 'w-0 opacity-0 lg:hidden' : 'opacity-100'
                )}
              >
                Sign Out
              </span>
            </button>
          </div>

          {/* Content Area */}
          <div className="w-full min-w-0 flex-1 space-y-8 pb-20 sm:space-y-10 sm:pb-24 lg:space-y-12 lg:pb-32">
            <Section id="profile" active={activeTab === 'profile'} title="My Profile">
              <div className="flex w-full min-w-0 flex-col items-start gap-5 rounded-[20px] border border-slate-200/50 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:gap-6 sm:rounded-[24px] sm:p-6 dark:border-white/5 dark:bg-white/2">
                <div className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f19]">
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
                    <button className="flex h-10 items-center rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-900 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md active:scale-95 sm:px-5 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
                      Upload new
                    </button>
                    <button className="flex h-10 items-center rounded-[14px] bg-transparent px-4 py-2.5 text-[13px] font-bold text-slate-500 transition-all hover:bg-red-50 hover:text-red-600 active:scale-95 sm:px-5 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="group min-w-0 space-y-2">
                    <label className="group-focus-within:text-primary-500 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors dark:text-slate-400">
                      Display Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.displayName || ''}
                      className={inputClasses}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="group min-w-0 space-y-2">
                    <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                      Email Address
                    </label>
                    <div className="relative min-w-0">
                      <input
                        type="email"
                        defaultValue={user?.email || ''}
                        readOnly
                        className={
                          inputClasses +
                          ' cursor-not-allowed truncate bg-slate-100 pr-22 opacity-60 sm:pr-28 dark:bg-slate-800/50'
                        }
                      />
                      <span className="pointer-events-none absolute top-1/2 right-2 max-w-[40%] -translate-y-1/2 truncate rounded-[6px] bg-slate-200 px-1.5 py-1 text-[9px] font-bold tracking-wider text-slate-500 uppercase sm:right-3 sm:max-w-none sm:px-2 sm:text-[10px] sm:tracking-widest dark:bg-slate-700 dark:text-slate-400">
                        Read Only
                      </span>
                    </div>
                  </div>
                </div>
                <div className="group space-y-2">
                  <label className="group-focus-within:text-primary-500 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors dark:text-slate-400">
                    Location
                  </label>
                  <input
                    type="text"
                    defaultValue="San Francisco, CA"
                    className={inputClasses}
                    placeholder="e.g. San Francisco, CA"
                  />
                </div>
                <div className="group space-y-2">
                  <label className="group-focus-within:text-primary-500 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors dark:text-slate-400">
                    Bio
                  </label>
                  <textarea
                    placeholder="Write a short bio about yourself..."
                    className={inputClasses + ' min-h-[120px] resize-none'}
                  ></textarea>
                  <p className="pr-2 text-right text-[12px] text-slate-400">Max 160 characters</p>
                </div>
              </div>

              <div className="flex border-t border-slate-200/50 pt-4 sm:justify-end dark:border-white/5">
                <button className="w-full rounded-[16px] bg-slate-900 px-8 py-3.5 text-[14px] font-bold text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] transition-all hover:shadow-[0_8px_25px_-6px_rgba(0,0,0,0.4)] active:scale-95 sm:w-auto dark:bg-white dark:text-slate-900">
                  Save Changes
                </button>
              </div>
            </Section>

            <Section id="appearance" active={activeTab === 'appearance'} title="Dashboard appearance">
              <p className="mb-6 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                These settings affect your private dashboard and back office only — not your public vCards. Customize
                each vCard under Card settings → Template in the editor.
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
                <div className="flex w-full flex-wrap items-center gap-4 rounded-[24px] border border-slate-200/50 bg-slate-50/50 p-4 dark:border-white/5 dark:bg-white/2">
                  {(['indigo', 'emerald', 'amber', 'rose', 'sky'] as const).map((color) => (
                    <button
                      key={color}
                      onClick={() => setAccentColor(color)}
                      className={cn(
                        'flex h-12 w-12 max-w-[80px] min-w-[60px] flex-1 items-center justify-center rounded-[16px] transition-all',
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
                  title="Email notifications"
                  description="Receive a daily summary of your activity and audience insights."
                  checked={toggles['email-notif']}
                  onChange={() => toggle('email-notif')}
                />
                <ToggleRow
                  title="Security alerts"
                  description="Get notified about unrecognized logins or password changes."
                  checked={toggles['security-alerts']}
                  onChange={() => toggle('security-alerts')}
                />
                <ToggleRow
                  title="Product updates"
                  description="Stay in the loop with the latest features and announcements."
                  checked={toggles['product-updates']}
                  onChange={() => toggle('product-updates')}
                />
              </div>
            </Section>

            <Section id="security" active={activeTab === 'security'} title="Security">
              <div className="space-y-8">
                <div className="space-y-6 rounded-[24px] border border-slate-200/50 bg-slate-50/50 p-4 sm:p-6 dark:border-white/5 dark:bg-white/2">
                  <div className="group space-y-2">
                    <label className="group-focus-within:text-primary-500 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors dark:text-slate-400">
                      Current Password
                    </label>
                    <input type="password" placeholder="••••••••" className={inputClasses} />
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="group space-y-2">
                      <label className="group-focus-within:text-primary-500 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors dark:text-slate-400">
                        New Password
                      </label>
                      <input type="password" placeholder="••••••••" className={inputClasses} />
                    </div>
                    <div className="group space-y-2">
                      <label className="group-focus-within:text-primary-500 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors dark:text-slate-400">
                        Confirm Password
                      </label>
                      <input type="password" placeholder="••••••••" className={inputClasses} />
                    </div>
                  </div>
                  <div className="flex w-full justify-end pt-2">
                    <button className="w-full rounded-[14px] bg-slate-900 px-6 py-3 text-[13px] font-bold text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] transition-all hover:shadow-[0_8px_25px_-6px_rgba(0,0,0,0.4)] active:scale-95 sm:w-auto dark:bg-white dark:text-slate-900">
                      Update Password
                    </button>
                  </div>
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
                    Connect with Canva to create custom profile images and wallpapers.
                  </p>
                  <div className="space-y-3">
                    <CanvaConnectRow userId={user?.uid} variant="icon" returnTo="/settings" />
                    <ConnectRow
                      icon={Bot}
                      title="Live Agent Integration"
                      iconStyle="bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20"
                      color="text-indigo-600 dark:text-indigo-400"
                      isConnected={liveAgentConnected}
                      onClick={() => {
                        if (!liveAgentConnected) setShowLiveAgentModal(true)
                      }}
                      onDisconnect={() => setLiveAgentConnected(false)}
                    />
                  </div>
                </div>
              </div>
            </Section>

            <Section id="analytics" active={activeTab === 'analytics'} title="Analytics">
              <p className="mb-8 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                Integrate pixels to track your events in Facebook and Google.
              </p>
              <div className="space-y-8">
                <div>
                  <h4 className="mb-3 pl-1 text-[14px] font-bold text-slate-900 dark:text-white">Facebook</h4>
                  <div className="space-y-4 rounded-[24px] border border-slate-200/50 bg-slate-50/50 p-6 dark:border-white/5 dark:bg-white/2">
                    <input type="text" placeholder="Pixel ID (Example: 1234567890)" className={inputClasses} />
                    <input type="text" placeholder="Facebook Conversions API Access Token" className={inputClasses} />
                  </div>
                </div>
                <div>
                  <h4 className="mb-3 pl-1 text-[14px] font-bold text-slate-900 dark:text-white">Google</h4>
                  <div className="rounded-[24px] border border-slate-200/50 bg-slate-50/50 p-6 dark:border-white/5 dark:bg-white/2">
                    <input
                      type="text"
                      placeholder="Google Measurement ID (Example: G-XXXXXXX)"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="pt-2"></div>
                <ToggleRow
                  title="UTM Parameters"
                  description="Make Google Analytics show traffic as 'social' traffic. The campaign parameter is set dynamically from the title of each link."
                  checked={toggles['utm-params']}
                  onChange={() => toggle('utm-params')}
                />
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

            <Section id="seo" active={activeTab === 'seo'} title="SEO">
              <div className="space-y-8">
                <div>
                  <h4 className="mb-2 pl-1 text-[15px] font-black text-slate-900 dark:text-white">Custom metadata</h4>
                  <p className="mb-6 pl-1 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                    Changes to metadata may take some time to appear on other platforms.
                  </p>
                  <div className="space-y-4 rounded-[24px] border border-slate-200/50 bg-slate-50/50 p-6 dark:border-white/5 dark:bg-white/2">
                    <input type="text" placeholder="Meta title (Example: @yourname)" className={inputClasses} />
                    <textarea
                      placeholder="Meta description (Example: Make your link do more.)"
                      className={inputClasses + ' min-h-[100px] resize-none'}
                    ></textarea>
                  </div>
                </div>

                <div className="pt-2"></div>
                <ToggleRow
                  title="Hide profile from search engines"
                  description="Adds a noindex tag to your profile so search engines won't include it in results."
                  checked={toggles['hide-search']}
                  onChange={() => toggle('hide-search')}
                />
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
                <div className="mt-8 rounded-[16px] border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/10 dark:bg-amber-500/5">
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
                  Manage your plan, billing details, and view payment history.
                </p>
                <button className="inline-flex items-center gap-2 rounded-[14px] bg-slate-900 px-6 py-3.5 text-[13px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.3)] transition-all hover:shadow-md active:scale-95 dark:bg-white dark:text-slate-900">
                  Manage Billing settings <ChevronRight className="h-4 w-4 opacity-50" />
                </button>
              </div>
            </Section>
          </div>
        </div>

        {showLiveAgentModal && (
          <ModalPortal>
            <LiveAgentSettingsModal
              onClose={() => setShowLiveAgentModal(false)}
              onConnect={() => setLiveAgentConnected(true)}
            />
          </ModalPortal>
        )}

        {showLogoutModal && (
          <ModalPortal>
            <LogoutConfirmModal
              onCancel={() => setShowLogoutModal(false)}
              onConfirm={handleLogout}
              isLoading={isLoggingOut}
            />
          </ModalPortal>
        )}
      </div>
    </div>
  )
}
