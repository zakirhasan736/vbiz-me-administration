'use client'

import { DashboardTourOverlay } from '@/components/tour/DashboardTourOverlay'
import { DashboardTourProvider } from '@/context/DashboardTourContext'
import { Suspense } from 'react'

export function DashboardTourRoot({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <DashboardTourProvider>
        {children}
        <DashboardTourOverlay />
      </DashboardTourProvider>
    </Suspense>
  )
}
