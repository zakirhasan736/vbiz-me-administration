export type AdminThemeColor = 'indigo' | 'emerald' | 'rose' | 'violet' | 'amber' | 'sky'

export interface AdminThemeConfig {
  accent: AdminThemeColor
  appName: string
  subTitle: string
  showActivities: boolean
  showSchedules: boolean
  showSocials: boolean
  showWeeklyEngagement: boolean
  showNetworkHealth: boolean
  maintenanceMode: boolean
  notifyOnContactSave: boolean
  notifyOnNewCard: boolean
  requireOwnerEmailVerify: boolean
  defaultNewCardStatus: 'active' | 'inactive'
  corporateCardQuota: number
  singleCardLimit: number
  sessionTimeoutMins: number
  autoSuspendInactiveDays: number
}

const DEFAULTS: AdminThemeConfig = {
  accent: 'indigo',
  appName: 'vbiz.me',
  subTitle: 'Super Admin',
  showActivities: true,
  showSchedules: true,
  showSocials: true,
  showWeeklyEngagement: true,
  showNetworkHealth: true,
  maintenanceMode: false,
  notifyOnContactSave: true,
  notifyOnNewCard: true,
  requireOwnerEmailVerify: false,
  defaultNewCardStatus: 'active',
  corporateCardQuota: 15,
  singleCardLimit: 1,
  sessionTimeoutMins: 60,
  autoSuspendInactiveDays: 90,
}

export function getAdminThemeConfig(): AdminThemeConfig {
  if (typeof window === 'undefined') return { ...DEFAULTS }
  const saved = localStorage.getItem('admin_theme_config')
  if (saved) {
    try {
      return { ...DEFAULTS, ...JSON.parse(saved) }
    } catch {
      /* ignore */
    }
  }
  return { ...DEFAULTS }
}

export function saveAdminThemeConfig(config: AdminThemeConfig) {
  localStorage.setItem('admin_theme_config', JSON.stringify(config))
  localStorage.setItem('admin_corporate_quota', String(config.corporateCardQuota))
  window.dispatchEvent(new Event('admin_theme_change'))
}

export function getThemeClasses(accent: AdminThemeColor) {
  switch (accent) {
    case 'emerald':
      return {
        bg: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-600 dark:border-emerald-500',
        ring: 'focus:ring-emerald-500/10',
        lightBg: 'bg-emerald-50 dark:bg-emerald-500/15',
        lightText: 'text-emerald-700 dark:text-emerald-400',
        gradientFrom: 'from-emerald-900 via-emerald-950 to-slate-900',
        shadow: 'shadow-emerald-600/10',
        accentColor: '#10b981',
        primaryColor: '#047857',
      }
    case 'rose':
      return {
        bg: 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-600 dark:border-rose-500',
        ring: 'focus:ring-rose-500/10',
        lightBg: 'bg-rose-50 dark:bg-rose-500/15',
        lightText: 'text-rose-700 dark:text-rose-400',
        gradientFrom: 'from-rose-900 via-rose-950 to-slate-900',
        shadow: 'shadow-rose-600/10',
        accentColor: '#f43f5e',
        primaryColor: '#be123c',
      }
    case 'violet':
      return {
        bg: 'bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600',
        text: 'text-violet-600 dark:text-violet-400',
        border: 'border-violet-600 dark:border-violet-500',
        ring: 'focus:ring-violet-500/10',
        lightBg: 'bg-violet-50 dark:bg-violet-500/15',
        lightText: 'text-violet-700 dark:text-violet-400',
        gradientFrom: 'from-violet-900 via-violet-950 to-slate-900',
        shadow: 'shadow-violet-600/10',
        accentColor: '#8b5cf6',
        primaryColor: '#6d28d9',
      }
    case 'amber':
      return {
        bg: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-600 dark:border-amber-500',
        ring: 'focus:ring-amber-500/10',
        lightBg: 'bg-amber-50 dark:bg-amber-500/15',
        lightText: 'text-amber-700 dark:text-amber-400',
        gradientFrom: 'from-amber-900 via-amber-950 to-slate-900',
        shadow: 'shadow-amber-600/10',
        accentColor: '#f59e0b',
        primaryColor: '#b45309',
      }
    case 'sky':
      return {
        bg: 'bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600',
        text: 'text-sky-600 dark:text-sky-400',
        border: 'border-sky-600 dark:border-sky-500',
        ring: 'focus:ring-sky-500/10',
        lightBg: 'bg-sky-50 dark:bg-sky-500/15',
        lightText: 'text-sky-700 dark:text-sky-400',
        gradientFrom: 'from-sky-900 via-sky-950 to-slate-900',
        shadow: 'shadow-sky-600/10',
        accentColor: '#0ea5e9',
        primaryColor: '#0369a1',
      }
    case 'indigo':
    default:
      return {
        bg: 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-600 dark:border-indigo-500',
        ring: 'focus:ring-indigo-500/10',
        lightBg: 'bg-indigo-50 dark:bg-indigo-500/15',
        lightText: 'text-indigo-700 dark:text-indigo-400',
        gradientFrom: 'from-indigo-900 via-indigo-950 to-slate-900',
        shadow: 'shadow-indigo-600/10',
        accentColor: '#6366f1',
        primaryColor: '#4f46e5',
      }
  }
}
