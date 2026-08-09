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
import { TakeTourBanner } from '@/components/tour/TakeTourBanner'
import { useAppSelector } from '@/hooks/redux'
import { useOrderTimer } from '@/hooks/useOrderTimer'
import {
  type DashboardPeriod,
  useExportDashboardOverviewMutation,
  useGetContactsQuery,
  useGetDashboardStatsQuery,
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
  const { data: stats } = useGetDashboardStatsQuery({ period: '30' })
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

      {(stats?.cards != null || stats?.totalViews != null) && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0b0f19]">
            <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Cards</p>
            <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{stats?.cards ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0b0f19]">
            <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Total views</p>
            <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{stats?.totalViews ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0b0f19]">
            <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Views (30d)</p>
            <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{stats?.viewsLast30Days ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0b0f19]">
            <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Notes (30d)</p>
            <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{stats?.notesLast30Days ?? 0}</p>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <WebsiteVisitsChart
          points={stats?.visitsChart?.points}
          total={stats?.visitsChart?.total ?? stats?.viewsLast30Days ?? 0}
          trendPercent={stats?.visitsChart?.trendPercent ?? 0}
        />
        <div className="flex h-full flex-col gap-6">
          <ContactsSavedCard count={(stats?.contactsLast30Days || 0) + (stats?.guestsLast30Days || 0)} />
        </div>
      </div>

      <SocialEngagementSection channels={stats?.socialChannels} />

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

  const { data: stats } = useGetDashboardStatsQuery({ period })
  const { data: contactsRaw } = useGetContactsQuery()
  const engagementSkip = (engagementPage - 1) * ENGAGEMENT_PAGE_SIZE
  const { data: engagement } = useGetRecentEngagementQuery({
    skip: engagementSkip,
    limit: ENGAGEMENT_PAGE_SIZE,
  })
  const [exportOverview, { isLoading: exporting }] = useExportDashboardOverviewMutation()

  const contacts = useMemo(() => (Array.isArray(contactsRaw) ? (contactsRaw as DashboardContact[]) : []), [contactsRaw])
  const savesCount = (stats?.contactsLast30Days || 0) + (stats?.guestsLast30Days || 0)
  const uniqueViews = stats?.uniqueViews ?? stats?.viewsLast30Days ?? 0
  const shares = stats?.shares ?? 0
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
      <TakeTourBanner
        tourKey="dashboard"
        title="Take a dashboard tour"
        body="New to vBiz? Walk through overview metrics and actions — you can start this anytime."
      />
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
          points={stats?.visitsChart?.points}
          total={stats?.visitsChart?.total ?? stats?.viewsLast30Days ?? 0}
          uniqueViews={uniqueViews}
          shares={shares}
          trendPercent={stats?.visitsChart?.trendPercent ?? 0}
        />
        <ContactsSavedCard
          count={savesCount}
          profileName={profileName}
          uniqueViews={uniqueViews}
          shares={shares}
          onOpen={() => openContactSaves('saves')}
        />
      </div>

      <SocialEngagementSection channels={stats?.socialChannels} />

      <EngagementAnalyticsSection socialChannels={stats?.socialChannels} />

      {hasOrder && <ActiveOrdersSection timeLeft={timeLeft} onContactSupport={() => setOwnerFeedbackMode('support')} />}

      <ContactSaveCta count={savesCount} onOpen={() => openContactSaves('saves')} />

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
          count={savesCount}
          contacts={contacts}
          notesCount={stats?.notesLast30Days ?? 0}
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
