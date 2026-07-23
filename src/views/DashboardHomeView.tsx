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
import { useState } from 'react'

const DashboardHomeView = () => {
  const [showContactModal, setShowContactModal] = useState(false)
  const { hasOrder, timeLeft } = useOrderTimer()

  return (
    <div className="animate-in fade-in duration-500">
      <DashboardHomeHeader />

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <WebsiteVisitsChart />
        <div className="flex h-full flex-col gap-6">
          <ContactsSavedCard />
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
