'use client'

import {
  ActiveOrdersSection,
  ContactModal,
  ContactsSavedCard,
  DashboardHomeHeader,
  RecentEngagementTable,
  SocialEngagementSection,
  WebsiteVisitsChart,
} from '@/components/dashboard/home'
import { useOrderTimer } from '@/hooks/useOrderTimer'
import { useGetDashboardStatsQuery } from '@/redux/features/profiles/profiles.api'
import { useState } from 'react'

const DashboardHomeView = () => {
  const [showContactModal, setShowContactModal] = useState(false)
  const { hasOrder, timeLeft } = useOrderTimer()
  const { data: stats } = useGetDashboardStatsQuery()

  return (
    <div className="animate-in fade-in duration-500">
      <DashboardHomeHeader />

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
        <WebsiteVisitsChart />
        <div className="flex h-full flex-col gap-6">
          <ContactsSavedCard count={(stats?.contactsLast30Days || 0) + (stats?.guestsLast30Days || 0)} />
        </div>
      </div>

      <SocialEngagementSection />

      {hasOrder && <ActiveOrdersSection timeLeft={timeLeft} onContactSupport={() => setShowContactModal(true)} />}

      <RecentEngagementTable />

      {showContactModal && <ContactModal onClose={() => setShowContactModal(false)} />}
    </div>
  )
}

export default DashboardHomeView
