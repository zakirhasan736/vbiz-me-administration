'use client'

import { VCardWeeklyEngagement } from '@/components/admin/VCardWeeklyEngagement'
import { ConfirmModal } from '@/components/ConfirmModal'
import { ContactSavesModal, type ContactSavesModalTab, type DashboardContact } from '@/components/dashboard/home'
import { ModalPortal } from '@/components/ModalPortal'
import { getAdminThemeConfig, getThemeClasses } from '@/lib/admin/adminTheme'
import { useVCard } from '@/lib/admin/AdminVCardListContext'
import { isWithinPeriod, periodCutoff } from '@/lib/dashboardPeriod'
import { notifyOwners } from '@/lib/notifications'
import { useAuth } from '@/providers/AuthProvider'
import { useGetHealthQuery } from '@/redux/features/health/health.api'
import {
  useCreateMeetingMutation,
  useDeleteMeetingMutation,
  useGetMeetingsQuery,
} from '@/redux/features/meetings/meetings.api'
import {
  type DashboardPeriod,
  type DashboardSocialChannel,
  useGetContactsQuery,
  useGetDashboardStatsQuery,
} from '@/redux/features/profiles/profiles.api'
import { MEETING_TYPES, type MeetingType } from '@/types/meeting'
import { cn } from '@/utils/cn'
import {
  Calendar,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  type LucideIcon,
  MessageCircle,
  Music2,
  Phone,
  Pin,
  Plus,
  Radio,
  Save,
  Trash2,
  TrendingUp,
  Twitter,
  Video,
  X,
  Youtube,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import CardActivities from './CardActivities'

const CHANNEL_UI: Record<DashboardSocialChannel, { icon: LucideIcon; bg: string }> = {
  facebook: { icon: Facebook, bg: 'bg-[#1877F2]/10 text-[#1877F2]' },
  twitter: { icon: Twitter, bg: 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' },
  instagram: { icon: Instagram, bg: 'bg-[#E4405F]/10 text-[#E4405F]' },
  whatsapp: { icon: MessageCircle, bg: 'bg-[#25D366]/10 text-[#25D366]' },
  linkedin: { icon: Linkedin, bg: 'bg-[#0A66C2]/10 text-[#0A66C2]' },
  youtube: { icon: Youtube, bg: 'bg-[#FF0000]/10 text-[#FF0000]' },
  tiktok: { icon: Music2, bg: 'bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white' },
  truth: { icon: Radio, bg: 'bg-[#5415D0]/10 text-[#5415D0]' },
  rumble: { icon: Radio, bg: 'bg-[#85C742]/10 text-[#85C742]' },
  pinterest: { icon: Pin, bg: 'bg-[#E60023]/10 text-[#E60023]' },
  website: { icon: Globe, bg: 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' },
}

const DEFAULT_SOCIAL_CHANNELS: Array<{
  channel: DashboardSocialChannel
  label: string
  count: number
}> = (
  [
    'facebook',
    'twitter',
    'instagram',
    'whatsapp',
    'linkedin',
    'youtube',
    'tiktok',
    'truth',
    'rumble',
    'pinterest',
    'website',
  ] as const
).map((channel) => ({
  channel,
  label:
    channel === 'whatsapp'
      ? 'WhatsApp'
      : channel === 'youtube'
        ? 'YouTube'
        : channel === 'tiktok'
          ? 'TikTok'
          : channel === 'truth'
            ? 'Truth Social'
            : channel === 'website'
              ? 'Web Visits'
              : channel.charAt(0).toUpperCase() + channel.slice(1),
  count: 0,
}))

export default function AdminDashboard() {
  const { vCardsList } = useVCard()
  const { user } = useAuth()
  const {
    data: health,
    isError: healthError,
    isFetching: healthFetching,
  } = useGetHealthQuery(undefined, {
    pollingInterval: 45_000,
  })

  const [themeConfig, setThemeConfig] = useState(() => getAdminThemeConfig())
  const [period, setPeriod] = useState<DashboardPeriod>('all')
  const [contactSavesModalTab, setContactSavesModalTab] = useState<ContactSavesModalTab>('saves')

  const { data: stats } = useGetDashboardStatsQuery({ period })
  const { data: contactsRaw } = useGetContactsQuery()

  const contacts = useMemo(() => (Array.isArray(contactsRaw) ? (contactsRaw as DashboardContact[]) : []), [contactsRaw])
  const totalSavedContacts = (stats?.contactsLast30Days || 0) + (stats?.guestsLast30Days || 0)
  const platformUniqueViews = stats?.uniqueViews ?? stats?.viewsLast30Days ?? 0
  const platformShares = stats?.shares ?? 0
  const platformViews = stats?.totalViews ?? 0
  const adminChartData = stats?.visitsChart?.points ?? []
  const socialChannels = stats?.socialChannels?.length ? stats.socialChannels : DEFAULT_SOCIAL_CHANNELS

  const networkHealthy = !healthError && health?.status === 'healthy'
  const networkLabel = networkHealthy ? 'Network: 100%' : healthFetching && !health ? 'Network: …' : 'Network: Offline'

  useEffect(() => {
    const handleThemeConfigChange = () => {
      setThemeConfig(getAdminThemeConfig())
    }
    window.addEventListener('admin_theme_change', handleThemeConfigChange)
    return () => window.removeEventListener('admin_theme_change', handleThemeConfigChange)
  }, [])

  const themeClasses = getThemeClasses(themeConfig.accent)

  // Prefer live dashboard stats; fall back to loaded profile list.
  const totalCardsCount = stats?.cards ?? vCardsList.length
  const activeCardsCount = vCardsList.filter((c) => c.status === 'active' || !c.status).length || totalCardsCount

  const { data: meetingsPage } = useGetMeetingsQuery({ limit: 100 })
  const [createMeeting, { isLoading: isCreatingMeeting }] = useCreateMeetingMutation()
  const [deleteMeeting] = useDeleteMeetingMutation()

  const [showMtgModal, setShowMtgModal] = useState(false)
  const [showContactSavesModal, setShowContactSavesModal] = useState(false)
  const [cancelMeetingId, setCancelMeetingId] = useState<string | null>(null)
  const [mtgHost, setMtgHost] = useState('')
  const [mtgType, setMtgType] = useState<MeetingType>('Growth Meeting')
  const [mtgDate, setMtgDate] = useState('')
  const [mtgTime, setMtgTime] = useState('')
  const [mtgLocation, setMtgLocation] = useState('Google Meet')

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mtgHost || !mtgDate || !mtgTime || isCreatingMeeting) return

    try {
      await createMeeting({
        host: mtgHost.trim(),
        type: mtgType,
        date: mtgDate,
        time: mtgTime,
        location: mtgLocation.trim() || null,
        status: 'Scheduled',
      }).unwrap()

      notifyOwners({
        category: 'event',
        title: 'New admin event scheduled',
        body: `${mtgType} with ${mtgHost} on ${mtgDate} at ${mtgTime}`,
        forceBrowser: true,
      })

      setMtgHost('')
      setMtgDate('')
      setMtgTime('')
      setShowMtgModal(false)
    } catch {
      /* keep modal open on failure */
    }
  }

  const handleDeleteMeeting = (id: string) => {
    setCancelMeetingId(id)
  }

  const confirmDeleteMeeting = async () => {
    if (!cancelMeetingId) return
    const id = cancelMeetingId
    try {
      await deleteMeeting(id).unwrap()
    } finally {
      setCancelMeetingId(null)
    }
  }

  const cutoff = useMemo(() => periodCutoff(period), [period])

  const filteredMeetings = useMemo(
    () => (meetingsPage?.items ?? []).filter((m) => m.status === 'Scheduled' && isWithinPeriod(m.date, cutoff)),
    [meetingsPage?.items, cutoff]
  )

  const openContactSaves = (tab: ContactSavesModalTab = 'saves') => {
    setContactSavesModalTab(tab)
    setShowContactSavesModal(true)
  }

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-8 p-4 duration-500 sm:p-6 lg:p-8">
      {/* Header section redesigned like Overview */}
      <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-4xl border border-slate-200/80 bg-white p-8 shadow-sm sm:flex-row sm:items-end dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="bg-primary-600/5 pointer-events-none absolute top-0 right-0 h-80 w-80 blur-[120px]"></div>
        <div className="z-10">
          <h1 className="text-[32px] leading-tight font-black tracking-tight text-slate-900 sm:text-[40px] dark:text-white">
            Welcome back, {user?.displayName || 'Super Admin'}! 👑
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 sm:text-[15px] dark:text-slate-400">
            Analyze platform-wide analytics, engagement, schedules, and network health.
          </p>
        </div>
        <div className="z-10 flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2 rounded-[14px] border border-slate-200/80 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/2 dark:text-slate-300">
            <span
              className={cn('h-2 w-2 rounded-full', networkHealthy ? 'animate-pulse bg-emerald-400' : 'bg-rose-400')}
            />
            {networkLabel}
          </div>
          <div className="relative flex items-center">
            <Calendar className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as DashboardPeriod)}
              aria-label="Date range"
              className="cursor-pointer appearance-none rounded-[14px] border border-slate-200 bg-white py-2.5 pr-9 pl-9 text-[13px] font-bold text-slate-700 shadow-sm transition-all outline-none hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-300 dark:hover:bg-white/5"
            >
              <option value="all">All</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Primary Analytics bento boxes (Chart + Stats) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Chart Box */}
        <div className="group relative flex flex-col overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] lg:col-span-2 dark:border-white/10 dark:bg-[#0b0f19]">
          <div className="relative z-10 flex h-full flex-col justify-between p-8 pb-0">
            <div className="mb-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-[12px] border shadow-sm',
                      themeClasses.lightBg,
                      themeClasses.lightText,
                      themeClasses.border
                    )}
                  >
                    <Eye className="h-5 w-5" />
                  </span>
                  <h2 className="pl-1 text-[13px] font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                    Aggregate Platform Views
                  </h2>
                </div>
                <div className="mt-2 flex items-baseline gap-4">
                  <span className="text-6xl font-black tracking-tighter text-slate-900 tabular-nums dark:text-white">
                    {platformViews.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-[10px] border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[13px] font-bold text-emerald-600 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <TrendingUp className="h-4 w-4" /> Live
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <span className="text-[11px] font-bold text-slate-500">
                    Unique:{' '}
                    <strong className="text-slate-800 dark:text-white">{platformUniqueViews.toLocaleString()}</strong>
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    Shares:{' '}
                    <strong className="text-slate-800 dark:text-white">{platformShares.toLocaleString()}</strong>
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    Saves:{' '}
                    <strong className="text-slate-800 dark:text-white">{totalSavedContacts.toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="relative mt-2 -ml-4 h-[260px] w-full flex-1 sm:ml-0">
              <div className="pointer-events-none absolute inset-0 top-auto bottom-0 z-10 h-8 bg-gradient-to-t from-white via-transparent to-transparent dark:from-[#0b0f19]"></div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={adminChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={
                          themeConfig.accent === 'emerald'
                            ? '#10b981'
                            : themeConfig.accent === 'indigo'
                              ? '#4f46e5'
                              : '#8b5cf6'
                        }
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={
                          themeConfig.accent === 'emerald'
                            ? '#10b981'
                            : themeConfig.accent === 'indigo'
                              ? '#4f46e5'
                              : '#8b5cf6'
                        }
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#e2e8f0"
                    strokeOpacity={0.4}
                    className="dark:stroke-white/10"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{
                      stroke: themeConfig.accent === 'emerald' ? '#10b981' : '#4f46e5',
                      strokeWidth: 1,
                      strokeDasharray: '4 4',
                    }}
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #fff)',
                      borderColor: 'var(--tooltip-border, rgba(0,0,0,0.1))',
                      borderRadius: '16px',
                      color: '#0f172a',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      fontWeight: 600,
                      padding: '12px',
                      border: 'none',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={
                      themeConfig.accent === 'emerald'
                        ? '#10b981'
                        : themeConfig.accent === 'indigo'
                          ? '#4f46e5'
                          : '#8b5cf6'
                    }
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: themeConfig.accent === 'emerald' ? '#10b981' : '#4f46e5' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Total Saved Contacts — click opens detail popup */}
        <button
          type="button"
          onClick={() => openContactSaves('saves')}
          className="group flex flex-col justify-between rounded-[32px] border border-slate-200/80 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300/60 hover:shadow-lg sm:p-8 dark:border-white/10 dark:bg-[#0b0f19] dark:hover:border-emerald-500/30"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm transition-transform group-hover:scale-105 dark:border-emerald-500/10 dark:bg-emerald-500/15 dark:text-emerald-400">
                <Save className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h4 className="truncate text-[11px] font-black tracking-wider text-slate-400 uppercase">
                  Total Saved Contacts
                </h4>
                <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                  Click to browse every saved person
                </p>
              </div>
            </div>
            <span className="shrink-0 self-start rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black tracking-wider whitespace-nowrap text-emerald-600 uppercase dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              Open list
            </span>
          </div>

          <div className="my-6 flex items-baseline gap-3">
            <span className="text-6xl font-black tracking-tighter text-slate-900 tabular-nums dark:text-white">
              {totalSavedContacts.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">guests saved a contact</span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 dark:border-white/5">
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">Cards</span>
              <span className="mt-1 block text-xl font-extrabold text-slate-800 dark:text-white">
                {totalCardsCount}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">Active</span>
              <span className="mt-1 block text-xl font-extrabold text-emerald-500">{activeCardsCount}</span>
            </div>
          </div>
        </button>
      </div>

      {/* All-card engagement: socials + weekly (no per-card selector) */}
      <div className="space-y-6 rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-white/10 dark:bg-[#0b0f19]">
        {themeConfig.showSocials !== false && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                  <Globe className={cn('h-5 w-5', themeClasses.text)} />
                  Platform Engagement
                </h2>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">
                  Social clicks across all cards, plus weekly engagement for the full network
                </p>
              </div>
              <span
                className={cn(
                  'rounded-full border px-3 py-1.5 text-[11px] font-black tracking-wider uppercase',
                  themeClasses.lightBg,
                  themeClasses.lightText,
                  themeClasses.border
                )}
              >
                All cards
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              <button type="button" onClick={() => openContactSaves('saves')} className="w-full text-left">
                <SocialMetricsCard
                  title="Saved Contacts"
                  value={String(totalSavedContacts)}
                  icon={Save}
                  bg={cn(themeClasses.lightBg, themeClasses.lightText)}
                />
              </button>
              {socialChannels.map((stat) => {
                const ui = CHANNEL_UI[stat.channel] ?? CHANNEL_UI.website
                return (
                  <SocialMetricsCard
                    key={stat.channel}
                    title={stat.label}
                    value={String(stat.count)}
                    icon={ui.icon}
                    bg={ui.bg}
                  />
                )
              })}
            </div>
          </div>
        )}

        {themeConfig.showWeeklyEngagement !== false && (
          <div
            className={cn(themeConfig.showSocials !== false && 'border-t border-slate-100 pt-2 dark:border-white/5')}
          >
            <VCardWeeklyEngagement vCardsList={vCardsList} aggregateAll embedded />
          </div>
        )}
      </div>

      {/* Schedules + Activity tracker */}
      {(themeConfig.showSchedules || themeConfig.showActivities) && (
        <div id="schedulers-activities-row" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {themeConfig.showSchedules && (
            <div
              className={cn(
                'flex flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f19]',
                themeConfig.showActivities ? 'lg:col-span-7' : 'lg:col-span-12'
              )}
            >
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-6 pt-6 pb-4 sm:flex-row sm:items-center dark:border-white/5">
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    <Calendar className={cn('h-3.5 w-3.5', themeClasses.text)} /> Growth calendar
                  </p>
                  <h2 className="mt-0.5 text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    Schedules & growth calls
                  </h2>
                  <p className="mt-0.5 text-xs font-semibold text-slate-400">
                    Book onboarding, growth, or support sessions with card owners.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMtgModal(true)}
                  className={cn(
                    'inline-flex items-center gap-2 self-start rounded-xl px-4 py-2.5 text-[11px] font-black tracking-wider text-white uppercase shadow-sm transition-all active:scale-95 sm:self-center',
                    themeClasses.bg
                  )}
                >
                  <Plus className="h-4 w-4" /> Schedule call
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 bg-slate-50/50 px-6 py-3 dark:border-white/5 dark:bg-white/[0.02]">
                <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-center dark:border-white/5 dark:bg-[#0b0f19]">
                  <p className="text-lg font-black text-slate-900 tabular-nums dark:text-white">
                    {filteredMeetings.length}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Upcoming</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-center dark:border-white/5 dark:bg-[#0b0f19]">
                  <p className="text-lg font-black text-indigo-600 tabular-nums dark:text-indigo-300">
                    {filteredMeetings.filter((m) => String(m.type).includes('Growth')).length}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Growth</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-center dark:border-white/5 dark:bg-[#0b0f19]">
                  <p className="text-lg font-black text-emerald-600 tabular-nums dark:text-emerald-300">
                    {filteredMeetings.filter((m) => String(m.type).includes('Onboarding')).length}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Onboard</p>
                </div>
              </div>

              <div className="max-h-[400px] flex-1 space-y-2.5 overflow-y-auto p-4">
                <AnimatePresence>
                  {filteredMeetings.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center dark:border-white/10">
                      <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-400">No calls scheduled yet.</p>
                      <button
                        type="button"
                        onClick={() => setShowMtgModal(true)}
                        className={cn('mt-3 text-[11px] font-black uppercase', themeClasses.text)}
                      >
                        Schedule the first call
                      </button>
                    </div>
                  ) : (
                    filteredMeetings.map((mtg) => {
                      const initials = String(mtg.host || '?')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                      const isGrowth = String(mtg.type).includes('Growth')
                      const isOnboard = String(mtg.type).includes('Onboarding')
                      return (
                        <motion.div
                          key={mtg.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.97 }}
                          className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 transition-colors hover:bg-white dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                        >
                          <div
                            className={cn(
                              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-xs font-black text-white',
                              isGrowth && 'from-indigo-500 to-violet-500',
                              isOnboard && 'from-emerald-500 to-teal-500',
                              !isGrowth && !isOnboard && 'from-amber-500 to-orange-500'
                            )}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={cn(
                                  'rounded-md border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase',
                                  isGrowth &&
                                    'border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300',
                                  isOnboard &&
                                    'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
                                  !isGrowth &&
                                    !isOnboard &&
                                    'border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'
                                )}
                              >
                                {mtg.type}
                              </span>
                              {mtg.location && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                                  <Video className="h-3 w-3" /> {mtg.location}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 truncate text-sm font-extrabold text-slate-900 dark:text-white">
                              {mtg.host}
                            </p>
                            <p className="mt-0.5 inline-flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {mtg.date}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {mtg.time}
                              </span>
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-black tracking-wider text-emerald-600 uppercase dark:bg-emerald-500/10">
                              {mtg.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteMeeting(mtg.id)}
                              className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                              title="Cancel call"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3 dark:border-white/5 dark:bg-white/2">
                <p className="text-[11px] font-semibold text-slate-400">
                  Tip: you can also schedule from any admin vCard card actions.
                </p>
                <Link
                  href="/admin/schedule"
                  className={cn('inline-flex items-center gap-1 text-[10px] font-black uppercase', themeClasses.text)}
                >
                  Full calendar <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}

          {themeConfig.showActivities && (
            <CardActivities className={cn(themeConfig.showSchedules ? 'lg:col-span-5' : 'lg:col-span-12')} />
          )}
        </div>
      )}

      {/* Popup: Total saved contacts detail */}
      {showContactSavesModal && (
        <ContactSavesModal
          count={totalSavedContacts}
          contacts={contacts}
          notesCount={stats?.notesLast30Days ?? 0}
          tab={contactSavesModalTab}
          onTabChange={setContactSavesModalTab}
          onClose={() => setShowContactSavesModal(false)}
        />
      )}

      {/* Modal: Schedule growth call */}
      {showMtgModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => setShowMtgModal(false)} />
            <form
              onSubmit={(e) => void handleScheduleMeeting(e)}
              className="animate-in zoom-in-95 relative w-full max-w-lg space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-black tracking-wider text-indigo-500 uppercase">
                    <Phone className="h-3.5 w-3.5" /> New session
                  </p>
                  <h3 className="mt-0.5 text-lg font-black text-slate-900 dark:text-white">Schedule a growth call</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMtgModal(false)}
                  className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    Owner / host name
                  </label>
                  <input
                    type="text"
                    required
                    value={mtgHost}
                    onChange={(e) => setMtgHost(e.target.value)}
                    placeholder="e.g. Zakir Hosen"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Type</label>
                  <select
                    value={mtgType}
                    onChange={(e) => setMtgType(e.target.value as MeetingType)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  >
                    {MEETING_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Venue</label>
                  <input
                    type="text"
                    value={mtgLocation}
                    onChange={(e) => setMtgLocation(e.target.value)}
                    placeholder="Google Meet, Zoom..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Date</label>
                  <input
                    type="date"
                    required
                    value={mtgDate}
                    onChange={(e) => setMtgDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Time</label>
                  <input
                    type="text"
                    required
                    value={mtgTime}
                    onChange={(e) => setMtgTime(e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMtgModal(false)}
                  className="px-4 py-2.5 text-[11px] font-black text-slate-500 uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingMeeting}
                  className={cn(
                    'rounded-xl px-5 py-2.5 text-[11px] font-black text-white uppercase disabled:opacity-60',
                    themeClasses.bg
                  )}
                >
                  {isCreatingMeeting ? 'Booking…' : 'Book session'}
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      <ConfirmModal
        open={!!cancelMeetingId}
        title="Cancel scheduled meeting?"
        description="Are you sure you want to cancel this scheduled meeting?"
        confirmLabel="Cancel meeting"
        variant="danger"
        onConfirm={() => void confirmDeleteMeeting()}
        onCancel={() => setCancelMeetingId(null)}
      />
    </div>
  )
}

type SocialMetricsCardProps = {
  title: string
  value: string
  icon: LucideIcon
  bg: string
}

function SocialMetricsCard({ title, value, icon: Icon, bg }: SocialMetricsCardProps) {
  return (
    <div className="group flex flex-col items-center rounded-3xl border border-slate-200/80 bg-white p-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 dark:border-white/5 dark:bg-[#0b0f19]">
      <div
        className={cn(
          'mb-3 flex h-10 w-10 items-center justify-center rounded-xl shadow-inner transition-transform group-hover:scale-105',
          bg
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <h4 className="text-lg leading-tight font-black tracking-tight text-slate-900 dark:text-white">{value}</h4>
      <p className="mt-1 w-full truncate text-[10px] font-bold tracking-wider text-slate-400 uppercase" title={title}>
        {title}
      </p>
    </div>
  )
}
