'use client'

import { Modal } from '@/components/ui/Modal'
import { useAppSelector } from '@/hooks/redux'
import type { CreateCardOwnerSession } from '@/lib/admin/createCardOwner'
import { useGetPortfolioMembersQuery, type PortfolioMemberRow } from '@/redux/features/adminProfiles/adminProfiles.api'
import { cn } from '@/utils/cn'
import { Check, Search, User, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'

type AssignPortfolioOwnerModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: (owner: CreateCardOwnerSession) => void
}

function toSession(user: Pick<PortfolioMemberRow, 'id' | 'name' | 'email' | 'role'>): CreateCardOwnerSession {
  return {
    userId: user.id,
    name: user.name?.trim() || user.email,
    email: user.email,
    role: user.role,
  }
}

function memberLabel(row: Pick<PortfolioMemberRow, 'name' | 'email'>): string {
  return row.name?.trim() || row.email
}

const EMPTY_MEMBERS: PortfolioMemberRow[] = []

export default function AssignPortfolioOwnerModal({ open, onClose, onConfirm }: AssignPortfolioOwnerModalProps) {
  const currentUser = useAppSelector((s) => s.user.user)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [wasOpen, setWasOpen] = useState(open)

  const selfSession = useMemo<CreateCardOwnerSession | null>(() => {
    if (!currentUser?.id) return null
    return {
      userId: currentUser.id,
      name: currentUser.name?.trim() || currentUser.email || 'You',
      email: currentUser.email || '',
      role: currentUser.role || 'admin',
    }
  }, [currentUser])

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setSearchQuery('')
      setSelectedId(selfSession?.userId ?? currentUser?.id ?? null)
    }
  }

  const { data, isLoading, isFetching, isError } = useGetPortfolioMembersQuery(undefined, { skip: !open })
  const members = data ?? EMPTY_MEMBERS

  const teammates = useMemo(() => {
    const selfId = selfSession?.userId
    const q = searchQuery.trim().toLowerCase()
    return members.filter((row) => {
      if (selfId && row.id === selfId) return false
      if (!q) return true
      const hay = `${row.name || ''} ${row.email} ${row.staffRole || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [members, searchQuery, selfSession?.userId])

  const resolvedSelectedId = selectedId ?? selfSession?.userId ?? null

  const selected = useMemo<CreateCardOwnerSession | null>(() => {
    if (!resolvedSelectedId) return null
    if (selfSession && resolvedSelectedId === selfSession.userId) return selfSession
    const row = members.find((m) => m.id === resolvedSelectedId)
    return row ? toSession(row) : null
  }, [members, resolvedSelectedId, selfSession])

  const handleContinue = () => {
    if (!selected) return
    onConfirm(selected)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-white/5">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Who is this card for?</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Create it for yourself, or assign it to an admin team member. Then continue to Manual or AI create.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-white/5"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-3">
          {selfSession ? (
            <button
              type="button"
              onClick={() => setSelectedId(selfSession.userId)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                resolvedSelectedId === selfSession.userId
                  ? 'border-indigo-500/40 bg-indigo-500/10 dark:bg-indigo-500/15'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20'
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-50 text-sm font-black text-indigo-600 dark:border-white/5 dark:bg-slate-900 dark:text-indigo-400">
                {(selfSession.name[0] || '?').toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                    {selfSession.name}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-indigo-500/15 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-indigo-600 uppercase dark:text-indigo-300">
                    <User className="h-2.5 w-2.5" />
                    You
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-400">
                  {selfSession.email}
                </span>
              </span>
              {resolvedSelectedId === selfSession.userId ? (
                <Check className="h-4 w-4 shrink-0 text-indigo-600" />
              ) : null}
            </button>
          ) : null}

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/15 dark:bg-slate-800">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members…"
              className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none dark:text-white"
            />
          </div>

          {isError ? (
            <p className="text-xs font-semibold text-rose-500">Failed to load team members.</p>
          ) : isLoading || isFetching ? (
            <p className="text-xs font-semibold text-slate-400">Loading team…</p>
          ) : teammates.length === 0 ? (
            <p className="text-xs font-semibold text-slate-400">
              {searchQuery.trim() ? 'No matching team members.' : 'No other team members in your portfolio.'}
            </p>
          ) : (
            <ul className="max-h-72 space-y-1.5 overflow-y-auto">
              {teammates.map((row) => {
                const active = resolvedSelectedId === row.id
                const displayName = memberLabel(row)
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                        active
                          ? 'border-indigo-500/40 bg-indigo-500/10 dark:bg-indigo-500/15'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20'
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-50 text-sm font-black text-violet-600 dark:border-white/5 dark:bg-slate-900 dark:text-violet-400">
                        {(displayName[0] || '?').toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                            {displayName}
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-violet-500/15 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-violet-600 uppercase dark:text-violet-300">
                            <Users className="h-2.5 w-2.5" />
                            {row.staffRole || 'Team member'}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-400">
                          {row.email}
                        </span>
                      </span>
                      {active ? <Check className="h-4 w-4 shrink-0 text-indigo-600" /> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="flex gap-3 border-t border-slate-100 px-6 py-4 dark:border-white/5">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl bg-slate-100 py-3.5 text-xs font-black tracking-wider text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!selected}
          onClick={handleContinue}
          className="flex-1 rounded-xl bg-indigo-600 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </Modal>
  )
}
