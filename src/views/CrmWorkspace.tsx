'use client'

import { BillingPackagesModal } from '@/components/settings/BillingPackagesModal'
import { Skeleton } from '@/components/ui/Skeleton'
import { isStaffRole } from '@/constants/userRole'
import { useAppSelector } from '@/hooks/redux'
import { usePackageAccess } from '@/hooks/usePackageAccess'
import { canSessionUseCrm } from '@/lib/crmAccess'
import { isFeatureLockCode } from '@/lib/packageAccess'
import { useGetCrmDashboardQuery } from '@/redux/features/crm/crm.api'
import { useGetPackagesQuery } from '@/redux/features/profiles/profiles.api'
import { Kanban, Lock, ShieldOff, Users } from 'lucide-react'
import { useState } from 'react'

function apiErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null
  const data = 'data' in error ? (error as { data?: unknown }).data : null
  if (!data || typeof data !== 'object') return null
  const record = data as { code?: unknown; data?: { code?: unknown; codes?: unknown } }
  if (typeof record.code === 'string') return record.code
  if (typeof record.data?.code === 'string') return record.data.code
  const codes = record.data?.codes
  if (Array.isArray(codes) && typeof codes[0] === 'string') return codes[0]
  return null
}

const SCOPE_COPY: Record<string, string> = {
  admin: 'Platform CRM',
  corporate: 'Company CRM',
  single: 'Your CRM',
}

export default function CrmWorkspace() {
  const user = useAppSelector((state) => state.user.user)
  const role = user?.role
  const { can, isLoading: entitlementsLoading, entitlements } = usePackageAccess()
  const packageAllowsCrm = can('allow_crm')
  const entitled = canSessionUseCrm({
    role,
    allowedModules: user?.allowedModules,
    packageAllowsCrm,
  })
  const staffDenied = isStaffRole(role) && !entitled
  const [billingOpen, setBillingOpen] = useState(false)

  const dashboardQuery = useGetCrmDashboardQuery(undefined, {
    skip: entitlementsLoading || !entitled,
  })
  const { data: packages = [] } = useGetPackagesQuery(undefined, { skip: entitled || staffDenied })
  const currentPackageId = entitlements?.packageId || null

  const lockedByApi = Boolean(dashboardQuery.error) && isFeatureLockCode(apiErrorCode(dashboardQuery.error))
  const showLock = !entitlementsLoading && (!entitled || lockedByApi)
  const metrics = dashboardQuery.data?.metrics
  const scopeLabel = dashboardQuery.data ? SCOPE_COPY[dashboardQuery.data.scope] || 'CRM' : 'CRM'

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <p className="text-[11px] font-bold tracking-[0.18em] text-indigo-500 uppercase">vBiz Me</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">CRM</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
          Guest captures from your public cards, in one workspace. Pipeline, tasks, and reminders come next.
        </p>
      </div>

      {entitlementsLoading || (entitled && dashboardQuery.isLoading) ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-36 rounded-[28px]" />
          <Skeleton className="h-36 rounded-[28px]" />
        </div>
      ) : staffDenied ? (
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-8 dark:border-white/10 dark:bg-[#0b0f19]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
            <ShieldOff className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-xl font-black text-slate-900 dark:text-white">
            CRM is limited to your admin modules
          </h2>
          <p className="mt-2 max-w-xl text-sm font-medium text-slate-600 dark:text-slate-300">
            Platform CRM uses the same Leads permission as Leads Management. Ask a Super Admin to grant the Leads module
            if you need access.
          </p>
        </div>
      ) : showLock ? (
        <div className="rounded-[28px] border border-amber-200/80 bg-amber-50/80 px-6 py-8 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm dark:bg-white/10">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-xl font-black text-slate-900 dark:text-white">CRM is on Professional plans</h2>
          <p className="mt-2 max-w-xl text-sm font-medium text-slate-600 dark:text-slate-300">
            Free includes your public card. Upgrade to Professional, Professional Concierge, or Corporate to open CRM
            for captured guests.
          </p>
          <button
            type="button"
            onClick={() => setBillingOpen(true)}
            className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Upgrade plan
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">{scopeLabel}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="flex items-center gap-3 text-slate-500">
                <Users className="h-4 w-4" />
                <span className="text-xs font-bold tracking-wider uppercase">New guests (7 days)</span>
              </div>
              <p className="mt-4 text-4xl font-black text-slate-900 dark:text-white">{metrics?.newLeads ?? 0}</p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="flex items-center gap-3 text-slate-500">
                <Kanban className="h-4 w-4" />
                <span className="text-xs font-bold tracking-wider uppercase">Captured guests</span>
              </div>
              <p className="mt-4 text-4xl font-black text-slate-900 dark:text-white">{metrics?.openLeads ?? 0}</p>
            </div>
          </div>
          {(metrics?.openLeads ?? 0) === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center dark:border-white/15 dark:bg-white/5">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                No guest captures yet. When someone saves details on a public card, they will show here.
              </p>
            </div>
          ) : null}
        </div>
      )}

      <BillingPackagesModal
        open={billingOpen}
        onClose={() => setBillingOpen(false)}
        packages={packages}
        currentPackageId={currentPackageId}
      />
    </div>
  )
}
