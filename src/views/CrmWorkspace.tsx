'use client'

import { CrmEventsBoard } from '@/components/crm/CrmEventsBoard'
import { CrmHomeDashboard } from '@/components/crm/CrmHomeDashboard'
import { CrmLeadsPanel } from '@/components/crm/CrmLeadsPanel'
import { CrmWorkNotesBoard } from '@/components/crm/CrmWorkNotesBoard'
import { ScheduleCalendarView } from '@/components/schedules/ScheduleCalendarView'
import { isStaffRole } from '@/constants/userRole'
import { useAppSelector } from '@/hooks/redux'
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll'
import { useOwnerMode } from '@/hooks/useOwnerMode'
import { canSessionUseCrm, CRM_UI_ENABLED } from '@/lib/crmAccess'
import { cn } from '@/utils/cn'
import {
  CalendarDays,
  CalendarHeart,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Lock,
  UserPlus,
} from 'lucide-react'
import { useEffect, useRef, useState, type ComponentType } from 'react'

type CrmTab = 'dashboard' | 'leads' | 'calendar' | 'work_notes' | 'events'

type FocusTarget = { tab: 'calendar'; id: string; date: string } | { tab: 'events'; id: string }

const CRM_TABS: Array<{
  id: CrmTab
  label: string
  longLabel?: string
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}> = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: UserPlus },
  { id: 'calendar', label: 'Schedules', icon: CalendarDays },
  { id: 'work_notes', label: 'Notes', icon: ClipboardList },
  { id: 'events', label: 'Wish', longLabel: 'Wish & Outreach', icon: CalendarHeart },
]

export default function CrmWorkspace() {
  const role = useAppSelector((state) => state.user.user?.role)
  const allowedModules = useAppSelector((state) => state.user.user?.allowedModules)
  const { isCorporateBackOffice } = useOwnerMode()
  const isStaff = isStaffRole(role)
  const allowed = CRM_UI_ENABLED && canSessionUseCrm({ role, allowedModules })
  const [tab, setTab] = useState<CrmTab>('dashboard')
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null)
  const skipFirstPeekRef = useRef(true)

  const {
    scrollRef,
    scrollClassName,
    didDragRef,
    canScrollLeft,
    canScrollRight,
    hiddenLeftCount,
    hiddenRightCount,
    scrollByTabs,
    scrollActiveIntoPeek,
  } = useHorizontalScroll('crm-workspace-tabs', tab)

  useEffect(() => {
    if (skipFirstPeekRef.current) {
      skipFirstPeekRef.current = false
      return
    }
    const frame = requestAnimationFrame(() => scrollActiveIntoPeek(tab))
    return () => cancelAnimationFrame(frame)
  }, [tab, scrollActiveIntoPeek])

  const selectTab = (next: CrmTab) => {
    if (didDragRef.current) return
    setTab(next)
    scrollActiveIntoPeek(next)
  }

  if (!allowed) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 dark:border-white/10 dark:bg-[#0b0f19]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/5">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-xl font-black text-slate-900 dark:text-white">CRM isn’t available</h2>
          <p className="mt-2 max-w-xl text-sm font-medium text-slate-600 dark:text-slate-300">
            Ask an administrator to give you access to leads so you can use CRM.
          </p>
        </div>
      </div>
    )
  }

  const eventScopes = isStaff
    ? undefined
    : isCorporateBackOffice
      ? (['one_to_one', 'group'] as MeetingScopeTuple)
      : (['one_to_one'] as MeetingScopeTuple)

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 overflow-x-hidden px-3 py-5 sm:px-4 sm:py-8 md:px-6">
      <div className="mb-5 sm:mb-6">
        <p className="text-[11px] font-bold tracking-[0.18em] text-indigo-500 uppercase">vBiz Me</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">CRM</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
          Follow up with leads, schedule conversations, and track notes with reminders.
        </p>
      </div>

      <div className="relative mb-5 sm:mb-6">
        {canScrollLeft ? (
          <button
            type="button"
            aria-label="Show previous CRM tabs"
            onClick={() => scrollByTabs(-1)}
            className="absolute top-1/2 left-1 z-20 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-full border border-slate-200/90 bg-white/95 px-1.5 py-1 text-[10px] font-black whitespace-nowrap text-slate-700 shadow-sm dark:border-white/10 dark:bg-[#0b0f19]/95 dark:text-slate-200"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {Math.max(hiddenLeftCount, 1)} prev
          </button>
        ) : null}

        {canScrollRight ? (
          <button
            type="button"
            aria-label="Show next CRM tabs"
            onClick={() => scrollByTabs(1)}
            className="absolute top-1/2 right-1 z-20 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-full border border-slate-200/90 bg-white/95 px-1.5 py-1 text-[10px] font-black whitespace-nowrap text-slate-700 shadow-sm dark:border-white/10 dark:bg-[#0b0f19]/95 dark:text-slate-200"
          >
            {Math.max(hiddenRightCount, 1)} next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : null}

        <div className="relative overflow-hidden rounded-2xl bg-slate-100 p-1 dark:bg-white/5">
          {canScrollLeft ? (
            <div className="pointer-events-none absolute inset-y-1 left-1 z-10 w-10 rounded-l-xl bg-linear-to-r from-slate-100 to-transparent dark:from-[#121722]" />
          ) : null}
          {canScrollRight ? (
            <div className="pointer-events-none absolute inset-y-1 right-1 z-10 w-10 rounded-r-xl bg-linear-to-l from-slate-100 to-transparent dark:from-[#121722]" />
          ) : null}

          <div
            ref={scrollRef}
            role="tablist"
            aria-label="CRM sections"
            className={cn(
              'cursor-grab items-center gap-1 [-webkit-overflow-scrolling:touch] active:cursor-grabbing',
              scrollClassName
            )}
          >
            {CRM_TABS.map((item) => {
              const active = tab === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`crm-tab-${item.id}`}
                  data-tab-chip
                  data-tab-name={item.id}
                  aria-selected={active}
                  aria-label={item.longLabel || item.label}
                  title={item.longLabel || item.label}
                  onClick={() => selectTab(item.id)}
                  className={cn(
                    'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[11px] font-black tracking-wider whitespace-nowrap uppercase transition-all',
                    active
                      ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="md:hidden">{item.label}</span>
                  <span className="hidden md:inline">{item.longLabel || item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {tab === 'dashboard' ? <CrmHomeDashboard onOpenTab={setTab} /> : null}
      {tab === 'leads' ? (
        <CrmLeadsPanel
          onOpenScheduleItem={(item) => {
            setFocusTarget({ tab: 'calendar', id: item.id, date: item.date })
            setTab('calendar')
          }}
          onOpenEventItem={(item) => {
            setFocusTarget({ tab: 'events', id: item.id })
            setTab('events')
          }}
        />
      ) : null}
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
          focusMeetingId={focusTarget?.tab === 'calendar' ? focusTarget.id : null}
          focusMeetingDate={focusTarget?.tab === 'calendar' ? focusTarget.date : null}
          onFocusConsumed={() => setFocusTarget(null)}
        />
      ) : null}
      {tab === 'work_notes' ? <CrmWorkNotesBoard /> : null}
      {tab === 'events' ? (
        <CrmEventsBoard
          cardPicker={isStaff ? 'admin' : 'own'}
          personSearch
          allowedScopes={eventScopes ? [...eventScopes] : undefined}
          defaultScope="one_to_one"
          focusEventId={focusTarget?.tab === 'events' ? focusTarget.id : null}
          onFocusConsumed={() => setFocusTarget(null)}
        />
      ) : null}
    </div>
  )
}

type MeetingScopeTuple = readonly ['one_to_one'] | readonly ['one_to_one', 'group']
