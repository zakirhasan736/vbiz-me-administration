'use client'

import { ConfirmModal } from '@/components/ConfirmModal'
import { useClearAuditLogsMutation, useGetAuditLogsQuery } from '@/redux/features/adminActivity/adminActivity.api'
import { cn } from '@/utils/cn'
import { AlertCircle, Calendar, Clock, FileCheck2, FileText, Layers, Search, ShieldAlert, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

export default function AdminAudit() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data, isLoading, isError, refetch } = useGetAuditLogsQuery({ limit: 100 })
  const [clearAuditLogs] = useClearAuditLogsMutation()

  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)

  const handleClearLogs = () => {
    setConfirmState({
      open: true,
      title: 'Clear audit log trail?',
      description:
        'Are you absolutely sure you want to completely clear the system audit log trail? This action is irreversible.',
      onConfirm: () => {
        void (async () => {
          try {
            await clearAuditLogs().unwrap()
          } finally {
            setConfirmState(null)
          }
        })()
      },
    })
  }

  const filteredLogs = useMemo(() => {
    const logs = data?.items ?? []
    const q = searchQuery.toLowerCase()
    return logs.filter(
      (log) =>
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.type.toLowerCase().includes(q)
    )
  }, [data?.items, searchQuery])

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-8 p-6 duration-500 md:p-10">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center dark:border-white/5">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            <FileText className="h-7 w-7 text-indigo-600 dark:text-indigo-400" /> System Audits & Operations Trail
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-400 md:text-sm">
            Chronological logging of administrative workspace configurations, account creation, and system events.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => void refetch()}
            className="hover:bg-slate-250 flex items-center gap-1.5 rounded-xl bg-slate-100 px-5 py-3.5 text-xs font-black tracking-wider text-slate-700 uppercase transition-all dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Clock className="h-3.5 w-3.5" /> Refresh Trail
          </button>
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-5 py-3.5 text-xs font-black tracking-wider text-rose-600 uppercase transition-all hover:bg-rose-100"
          >
            <Trash2 className="h-3.5 w-3.5" /> Wipe Audit Trails
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 md:flex-row dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200/50 bg-slate-50 px-4 py-3 md:flex-1 dark:border-white/5 dark:bg-slate-800/50">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operations logs by action, type, or event keyword..."
            className="w-full bg-transparent text-sm font-semibold text-slate-700 placeholder-slate-400 outline-none dark:text-white"
          />
        </div>
      </div>

      <div className="rounded-4xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8 dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white">
              <Clock className="h-5 w-5 text-indigo-500" /> Administrative Operations Audit Trails
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              Dispatched records tracking administrative command executions
            </p>
          </div>
          <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-3.5 py-1 text-[10px] font-black text-indigo-600 uppercase dark:border-indigo-500/10 dark:bg-indigo-500/10 dark:text-indigo-400">
            System Level Persistence
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-sm font-semibold text-slate-400">Loading audit trail…</div>
        ) : isError ? (
          <div className="py-20 text-center text-sm font-semibold text-rose-500">Failed to load audit logs.</div>
        ) : filteredLogs.length > 0 ? (
          <div className="max-h-125 space-y-4 overflow-y-auto pr-2">
            {filteredLogs.map((log, idx) => (
              <div
                key={log.id || idx}
                className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-white dark:border-white/5 dark:bg-white/2 dark:hover:bg-white/4"
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                    log.type.includes('delete') || log.type.includes('cancel')
                      ? 'border-rose-100 bg-rose-50 text-rose-600'
                      : log.type.includes('create') || log.type.includes('schedule')
                        ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                        : 'border-indigo-100 bg-indigo-50 text-indigo-600'
                  )}
                >
                  {log.type.includes('delete') || log.type.includes('cancel') ? (
                    <ShieldAlert className="h-4 w-4" />
                  ) : log.type.includes('schedule') ? (
                    <Calendar className="h-4 w-4" />
                  ) : log.type.includes('create') ? (
                    <FileCheck2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{log.action}</h4>
                    <span className="shrink-0 text-[10px] font-bold text-slate-400">{log.time}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed font-semibold text-slate-500">{log.details}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-black tracking-wider text-slate-500 uppercase dark:bg-white/5">
                      {log.type}
                    </span>
                    {log.actor ? (
                      <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">{log.actor}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <Layers className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-400">No audit records match your search.</p>
          </div>
        )}
      </div>

      {confirmState?.open && (
        <ConfirmModal
          open
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel="Wipe"
          variant="danger"
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  )
}
