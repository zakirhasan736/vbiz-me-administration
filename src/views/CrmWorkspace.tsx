'use client'

import { CrmHomeDashboard } from '@/components/crm/CrmHomeDashboard'
import { CrmLeadsPanel } from '@/components/crm/CrmLeadsPanel'
import { CrmWorkNotesBoard } from '@/components/crm/CrmWorkNotesBoard'
import { ScheduleCalendarView } from '@/components/schedules/ScheduleCalendarView'
import { isStaffRole } from '@/constants/userRole'
import { useAppSelector } from '@/hooks/redux'
import { useOwnerMode } from '@/hooks/useOwnerMode'
import { usePackageAccess } from '@/hooks/usePackageAccess'
import { canSessionUseCrm, CRM_UI_ENABLED } from '@/lib/crmAccess'
import { cn } from '@/utils/cn'
import { CalendarDays, ClipboardList, LayoutDashboard, Lock, UserPlus } from 'lucide-react'
import { useState } from 'react'

type CrmTab = 'dashboard' | 'leads' | 'calendar' | 'work_notes'

export default function CrmWorkspace() {
  const role = useAppSelector((state) => state.user.user?.role)
  const allowedModules = useAppSelector((state) => state.user.user?.allowedModules)
  const { allow_crm: packageAllowsCrm, isLoading: entitlementsLoading } = usePackageAccess()
  const { isCorporateBackOffice } = useOwnerMode()
  const isStaff = isStaffRole(role)
  const allowed =
    CRM_UI_ENABLED &&
    canSessionUseCrm({
      role,
      allowedModules,
      packageAllowsCrm: isStaff ? false : packageAllowsCrm,
    })
  const [tab, setTab] = useState<CrmTab>('dashboard')

  if (!isStaff && entitlementsLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        <p className="text-sm font-semibold text-slate-500">Loading your contacts…</p>
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 dark:border-white/10 dark:bg-[#0b0f19]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/5">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-xl font-black text-slate-900 dark:text-white">CRM isn’t on this account</h2>
          <p className="mt-2 max-w-xl text-sm font-medium text-slate-600 dark:text-slate-300">
            {isStaff
              ? 'Ask an administrator to give you access to leads so you can use CRM.'
              : 'Upgrade to Professional, Professional Concierge, or Corporate to follow up with leads and book conversations here.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <p className="text-[11px] font-bold tracking-[0.18em] text-indigo-500 uppercase">vBiz Me</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">CRM</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
          Follow up with leads, schedule conversations, and track work notes with reminders.
        </p>
      </div>

      <div className="mb-6 flex w-full gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1 dark:bg-white/5">
        <TabButton
          active={tab === 'dashboard'}
          onClick={() => setTab('dashboard')}
          icon={LayoutDashboard}
          label="Home"
        />
        <TabButton active={tab === 'leads'} onClick={() => setTab('leads')} icon={UserPlus} label="Leads" />
        <TabButton
          active={tab === 'calendar'}
          onClick={() => setTab('calendar')}
          icon={CalendarDays}
          label="Schedules"
        />
        <TabButton
          active={tab === 'work_notes'}
          onClick={() => setTab('work_notes')}
          icon={ClipboardList}
          label="Work notes"
        />
      </div>

      {tab === 'dashboard' ? <CrmHomeDashboard onOpenTab={setTab} /> : null}
      {tab === 'leads' ? <CrmLeadsPanel /> : null}
      {tab === 'calendar' ? (
        <ScheduleCalendarView
          compact
          meetingsSource="crm_zoho"
          canManageMeetings
          cardPicker={isStaff ? 'admin' : 'own'}
          personSearch
          allowedScopes={isStaff ? undefined : isCorporateBackOffice ? ['one_to_one', 'group'] : ['one_to_one']}
          defaultScope="one_to_one"
          eyebrow="Calendar"
          title="Schedule"
          subtitle="Meetings load from your database for speed. Booking still syncs to Zoho Calendar."
          upcomingSubtitle="What’s coming up next on your calendar."
        />
      ) : null}
      {tab === 'work_notes' ? <CrmWorkNotesBoard /> : null}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof CalendarDays
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-black tracking-wider uppercase transition-all',
        active ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300' : 'text-slate-500'
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  )
}
