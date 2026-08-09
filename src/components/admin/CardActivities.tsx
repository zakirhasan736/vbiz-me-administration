'use client'

import { ConfirmModal } from '@/components/ConfirmModal'
import { getAdminThemeConfig, getThemeClasses } from '@/lib/admin/adminTheme'
import { useClearAuditLogsMutation, useGetActivityFeedQuery } from '@/redux/features/adminActivity/adminActivity.api'
import type { ActivityCategory } from '@/types/activity'
import { cn } from '@/utils/cn'
import {
  Activity,
  Ban,
  Calendar,
  Eye,
  Layers,
  MousePointerClick,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
  User,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'

function iconFor(type: string) {
  const t = type.toLowerCase()
  if (t.includes('save')) return Save
  if (t.includes('view')) return Eye
  if (t.includes('create') || t.includes('meeting')) return Plus
  if (t.includes('click')) return MousePointerClick
  if (t.includes('delete') || t.includes('cancel')) return Ban
  if (t.includes('schedule')) return Calendar
  if (t.includes('settings') || t.includes('update') || t.includes('status')) return Settings2
  return Activity
}

function toneFor(type: string) {
  const t = type.toLowerCase()
  if (t.includes('create') || t.includes('save'))
    return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
  if (t.includes('delete') || t.includes('cancel'))
    return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20'
  if (t.includes('warning') || t.includes('quota'))
    return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
  if (t.includes('click') || t.includes('view'))
    return 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20'
  return 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20'
}

const FILTER_TO_CATEGORY: Record<string, ActivityCategory> = {
  all: 'all',
  engagement: 'engagement',
  creations: 'creations',
  status: 'updates',
  deletions: 'deletions',
}

export default function CardActivities({ className }: { className?: string } = {}) {
  const [filterType, setFilterType] = useState<string>('all')
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [themeConfig] = useState(() => getAdminThemeConfig())
  const themeClasses = getThemeClasses(themeConfig.accent)

  const category = FILTER_TO_CATEGORY[filterType] ?? 'all'
  const { data, isLoading, isError, refetch, isFetching } = useGetActivityFeedQuery({
    category,
    limit: 50,
  })
  const [clearAuditLogs, { isLoading: isClearing }] = useClearAuditLogsMutation()

  const logs = data?.items ?? []
  const counts = data?.counts

  const summary = useMemo(
    () => ({
      total: counts?.events ?? logs.length,
      saves: counts?.saves ?? 0,
      clicks: counts?.engagement ?? 0,
    }),
    [counts, logs.length]
  )

  const confirmClearLogs = async () => {
    try {
      await clearAuditLogs().unwrap()
    } finally {
      setClearConfirmOpen(false)
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f19]',
        className
      )}
    >
      <div className="border-b border-slate-100 px-6 pt-6 pb-4 dark:border-white/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black tracking-wider text-slate-400 uppercase">
              <Activity className={cn('h-3.5 w-3.5', themeClasses.text)} /> Live feed
            </p>
            <h2 className="mt-0.5 text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Card activity tracker
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              What changed across cards — saves, edits, clicks, and admin actions.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-white"
              title="Refresh"
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </button>
            {logs.length > 0 && (
              <button
                type="button"
                onClick={() => setClearConfirmOpen(true)}
                className="rounded-xl border border-rose-200/60 p-2.5 text-rose-500 hover:bg-rose-50 dark:border-rose-500/20 dark:hover:bg-rose-500/10"
                title="Clear audit logs"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: 'Events', value: summary.total },
            { label: 'Saves', value: summary.saves },
            { label: 'Engagement', value: summary.clicks },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-center dark:border-white/5 dark:bg-white/3"
            >
              <p className="text-lg font-black text-slate-900 tabular-nums dark:text-white">{s.value}</p>
              <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-100/80 p-1 dark:bg-white/4">
          {[
            { id: 'all', label: 'All' },
            { id: 'engagement', label: 'Engage' },
            { id: 'creations', label: 'New' },
            { id: 'status', label: 'Updates' },
            { id: 'deletions', label: 'Removed' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFilterType(btn.id)}
              className={cn(
                'min-w-16 flex-1 rounded-xl py-2 text-[10px] font-black tracking-wider uppercase transition-all',
                filterType === btn.id
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-105 flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="py-14 text-center text-xs font-semibold text-slate-400">Loading activity…</div>
          ) : isError ? (
            <div className="py-14 text-center text-xs font-semibold text-rose-500">Failed to load activity feed.</div>
          ) : logs.length > 0 ? (
            logs.map((log) => {
              const Icon = iconFor(log.type)
              return (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/40 p-3.5 transition-colors hover:bg-white dark:border-white/5 dark:bg-white/2 dark:hover:bg-white/4"
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                      toneFor(log.type)
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="truncate text-[13px] leading-snug font-extrabold text-slate-900 dark:text-white">
                        {log.action}
                      </h4>
                      <span className="shrink-0 text-[10px] font-bold text-slate-400">{log.time}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                      {log.details}
                    </p>
                    <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      <User className="h-3 w-3" /> {log.actor || 'System'}
                    </p>
                  </div>
                </motion.div>
              )
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center dark:border-white/10">
              <Layers className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-white/15" />
              <p className="text-xs font-semibold text-slate-400">No activities in this filter.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmModal
        open={clearConfirmOpen}
        title="Clear activity log?"
        description="Erase admin audit log entries? Engagement events (views, clicks, saves) are kept."
        confirmLabel={isClearing ? 'Clearing…' : 'Clear log'}
        variant="danger"
        onConfirm={() => void confirmClearLogs()}
        onCancel={() => setClearConfirmOpen(false)}
      />
    </div>
  )
}
