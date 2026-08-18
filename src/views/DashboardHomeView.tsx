'use client'

import {
  ActiveOrdersSection,
  ContactModal,
  ContactSaveCta,
  ContactSavesModal,
  type ContactSavesModalTab,
  ContactsSavedCard,
  type DashboardContact,
  DashboardHomeHeader,
  EngagementAnalyticsSection,
  type OwnerFeedbackMode,
  RecentEngagementTable,
  SocialEngagementSection,
  WebsiteVisitsChart,
} from '@/components/dashboard/home'
import { useAppSelector } from '@/hooks/redux'
import { useDashboardLiveKpis } from '@/hooks/useAdminDashboardLiveKpis'
import { useOrderTimer } from '@/hooks/useOrderTimer'
import {
  dashboardOverviewQueryOptions,
  type DashboardPeriod,
  useExportDashboardOverviewMutation,
  useGetContactsQuery,
  useGetDashboardSummaryQuery,
  useGetRecentEngagementQuery,
} from '@/redux/features/profiles/profiles.api'
import CorporateOwnerDashboardHome from '@/views/CorporateOwnerDashboardHome'
import { Calendar, Download, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'

const ENGAGEMENT_PAGE_SIZE = 10

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function overviewExportFilename(period: DashboardPeriod, now = new Date()): string {
  const stamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').replace(/Z$/, '')
  const label = period === 'all' ? 'all-time' : `last-${period}-days`
  return `overview-${label}_${stamp}.pdf`
}

function LegacyDashboardHome() {
  const user = useAppSelector((state) => state.user.user)
  const [showContactModal, setShowContactModal] = useState(false)
  const [engagementPage, setEngagementPage] = useState(1)
  const { hasOrder, timeLeft } = useOrderTimer()
  const { data: stats } = useGetDashboardSummaryQuery({ period: '30' }, dashboardOverviewQueryOptions)
  const overviewStats = stats?.stats
  const engagementSkip = (engagementPage - 1) * ENGAGEMENT_PAGE_SIZE
  const { data: engagement } = useGetRecentEngagementQuery({
    skip: engagementSkip,
    limit: ENGAGEMENT_PAGE_SIZE,
  })
  const [exportOverview, { isLoading: exporting }] = useExportDashboardOverviewMutation()

  const handleExport = async () => {
    try {
      const blob = await exportOverview({ period: '30' }).unwrap()
      downloadBlob(blob, overviewExportFilename('30'))
    } catch {
      // Keep UI quiet; button re-enables via isLoading.
    }
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-1/2 lg:w-full">
          <h1 className="text-[32px] leading-tight font-black tracking-tight text-slate-900 sm:text-[40px] dark:text-white">
            Overview
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 sm:text-[15px] dark:text-slate-400">
            Track your vCard performance and engagement metrics in real-time.
          </p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-1/2 sm:justify-end lg:w-full">
          <button
            type="button"
            className="flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-300 dark:hover:bg-white/5"
          >
            <Calendar className="h-4 w-4 text-slate-400" />
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-[14px] bg-slate-900 px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>

      {(overviewStats?.cards != null || overviewStats?.totalViews != null) && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0b0f19]">
            <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Cards</p>
            <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{overviewStats?.cards ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0b0f19]">
            <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Total views</p>
            <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{overviewStats?.totalViews ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0b0f19]">
            <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Views (30d)</p>
            <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
              {overviewStats?.viewsLast30Days ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0b0f19]">
            <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Notes (30d)</p>
            <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
              {overviewStats?.notesLast30Days ?? 0}
            </p>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <WebsiteVisitsChart
          points={overviewStats?.visitsChart?.points}
          total={overviewStats?.visitsChart?.total ?? overviewStats?.viewsLast30Days ?? 0}
          trendPercent={overviewStats?.visitsChart?.trendPercent ?? 0}
        />
        <div className="flex h-full flex-col gap-6">
          <ContactsSavedCard
            count={(overviewStats?.contactsLast30Days || 0) + (overviewStats?.guestsLast30Days || 0)}
          />
        </div>
      </div>

      <SocialEngagementSection channels={overviewStats?.socialChannels} />

      {hasOrder && <ActiveOrdersSection timeLeft={timeLeft} onContactSupport={() => setShowContactModal(true)} />}

      <RecentEngagementTable
        rows={engagement?.items}
        page={engagementPage}
        total={engagement?.total ?? 0}
        pageSize={engagement?.limit ?? ENGAGEMENT_PAGE_SIZE}
        onPageChange={setEngagementPage}
      />

      {showContactModal && (
        <ContactModal
          onClose={() => setShowContactModal(false)}
          fromRole="single"
          fromName={user?.name || 'Owner'}
          fromEmail={user?.email || undefined}
        />
      )}
    </div>
  )
}

function SingleOwnerDashboardHome() {
  const user = useAppSelector((state) => state.user.user)
  const [period, setPeriod] = useState<DashboardPeriod>('all')
  const [ownerFeedbackMode, setOwnerFeedbackMode] = useState<OwnerFeedbackMode | null>(null)
  const [showContactSavesModal, setShowContactSavesModal] = useState(false)
  const [contactSavesModalTab, setContactSavesModalTab] = useState<ContactSavesModalTab>('saves')
  const [engagementPage, setEngagementPage] = useState(1)
  const { hasOrder, timeLeft } = useOrderTimer()

  const { data: summary, isLoading: statsLoading } = useGetDashboardSummaryQuery(
    { period },
    dashboardOverviewQueryOptions
  )
  const stats = summary?.stats
  const { overlay: liveKpis } = useDashboardLiveKpis(period)
  const { data: contactsRaw } = useGetContactsQuery(undefined, { skip: !showContactSavesModal })
  const engagementSkip = (engagementPage - 1) * ENGAGEMENT_PAGE_SIZE
  const { data: pagedEngagement } = useGetRecentEngagementQuery(
    {
      skip: engagementSkip,
      limit: ENGAGEMENT_PAGE_SIZE,
    },
    { skip: engagementPage === 1 }
  )
  const engagement = engagementPage === 1 ? summary?.recentEngagement : pagedEngagement
  const [exportOverview, { isLoading: exporting }] = useExportDashboardOverviewMutation()

  const contacts = useMemo(
    () =>
      Array.isArray(contactsRaw)
        ? (contactsRaw as DashboardContact[])
        : ((summary?.contactsPreview || []) as DashboardContact[]),
    [contactsRaw, summary?.contactsPreview]
  )
  const statsReady = Boolean(stats) && !statsLoading
  const savesCount = statsReady
    ? (stats?.contactsLast30Days || 0) + (stats?.guestsLast30Days || 0) + liveKpis.saves
    : undefined
  const uniqueViews = statsReady ? (stats?.uniqueViews ?? stats?.viewsLast30Days ?? 0) + liveKpis.views : undefined
  const shares = statsReady ? (stats?.shares ?? 0) : undefined
  const visitsTotal = statsReady
    ? (stats?.visitsChart?.total ?? stats?.viewsLast30Days ?? 0) + liveKpis.views
    : undefined
  const trendPercent = statsReady ? (stats?.visitsChart?.trendPercent ?? 0) : 0
  const notesCount = statsReady ? (stats?.notesLast30Days ?? 0) : undefined
  const profileName = stats?.profiles?.[0]?.name || 'Your card'

  const openContactSaves = (tab: ContactSavesModalTab = 'saves') => {
    setContactSavesModalTab(tab)
    setShowContactSavesModal(true)
  }

  const handleExport = async () => {
    try {
      const blob = await exportOverview({ period }).unwrap()
      downloadBlob(blob, overviewExportFilename(period))
    } catch {
      // Keep UI quiet; button re-enables via isLoading.
    }
  }

  return (
    <div className="animate-in fade-in min-w-0 duration-500">
      <DashboardHomeHeader
        period={period}
        onPeriodChange={(next) => {
          setPeriod(next)
          setEngagementPage(1)
        }}
        onExport={handleExport}
        exporting={exporting}
        onFeedback={() => setOwnerFeedbackMode('feedback')}
        onContactSupport={() => setOwnerFeedbackMode('support')}
      />

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3" data-tour="dash-metrics">
        <WebsiteVisitsChart
          points={statsReady ? stats?.visitsChart?.points : undefined}
          total={visitsTotal}
          uniqueViews={uniqueViews}
          shares={shares}
          trendPercent={trendPercent}
          loading={!statsReady}
        />
        <ContactsSavedCard
          count={savesCount}
          profileName={profileName}
          uniqueViews={uniqueViews}
          shares={shares}
          loading={!statsReady}
          onOpen={() => openContactSaves('saves')}
        />
      </div>

      <SocialEngagementSection channels={statsReady ? stats?.socialChannels : undefined} loading={!statsReady} />

      <EngagementAnalyticsSection socialChannels={statsReady ? stats?.socialChannels : undefined} />

      {hasOrder && <ActiveOrdersSection timeLeft={timeLeft} onContactSupport={() => setOwnerFeedbackMode('support')} />}

      <ContactSaveCta count={savesCount} loading={!statsReady} onOpen={() => openContactSaves('saves')} />

      <RecentEngagementTable
        rows={engagement?.items}
        page={engagementPage}
        total={engagement?.total ?? 0}
        pageSize={engagement?.limit ?? ENGAGEMENT_PAGE_SIZE}
        onPageChange={setEngagementPage}
      />

      {ownerFeedbackMode && (
        <ContactModal
          key={ownerFeedbackMode}
          mode={ownerFeedbackMode}
          onClose={() => setOwnerFeedbackMode(null)}
          fromRole="single"
          fromName={user?.name || 'Owner'}
          fromEmail={user?.email || undefined}
        />
      )}

      {showContactSavesModal && (
        <ContactSavesModal
          count={savesCount ?? 0}
          contacts={contacts}
          notesCount={notesCount ?? 0}
          tab={contactSavesModalTab}
          onTabChange={setContactSavesModalTab}
          onClose={() => setShowContactSavesModal(false)}
        />
      )}
    </div>
  )
}

const DashboardHomeView = () => {
  const role = useAppSelector((state) => state.user.user?.role)
  if (role === 'vcard-owner') return <SingleOwnerDashboardHome />
  if (role === 'corporate-owner') return <CorporateOwnerDashboardHome />
  return <LegacyDashboardHome />
}

export default DashboardHomeView
