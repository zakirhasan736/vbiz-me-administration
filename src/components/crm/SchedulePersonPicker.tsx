'use client'

import type { ProfileOwnerSelection } from '@/components/admin/ProfileOwnerPicker'
import { AddCrmLeadModal } from '@/components/crm/AddCrmLeadModal'
import { notify } from '@/lib/toast/toast'
import {
  useCreateCrmLeadMutation,
  useLazySearchCrmSchedulePeopleQuery,
  type CrmLeadRow,
  type SchedulePerson,
} from '@/redux/features/crm/crm.api'
import { Search, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'

export function selectionFromSchedulePerson(person: SchedulePerson): ProfileOwnerSelection | null {
  if (!person.profileId) return null
  return {
    profileId: person.profileId,
    hostName: person.name,
    ownerEmails: person.email ? [person.email] : [],
    identity:
      person.subtitle ||
      [person.kind === 'guest' ? 'Saved guest' : 'Card', person.email, person.phone].filter(Boolean).join(' · '),
  }
}

function selectionFromCreatedLead(lead: CrmLeadRow): ProfileOwnerSelection {
  return {
    profileId: lead.vCardId,
    hostName: lead.fullName,
    ownerEmails: lead.email ? [lead.email] : [],
    identity: ['New CRM lead', lead.vCardName, lead.email, lead.phoneNumber].filter(Boolean).join(' · '),
  }
}

type SchedulePersonPickerProps = {
  value: ProfileOwnerSelection | null
  onChange: (next: ProfileOwnerSelection | null) => void
  label?: string
  allowCreateLead?: boolean
  /** When creating a lead inline, lock to this card if set. */
  defaultProfileId?: string | null
  /** Called after a lead is created so the booking form can add follow-up notes. */
  onCreatedLead?: (lead: CrmLeadRow) => void
}

export function SchedulePersonPicker({
  value,
  onChange,
  label = 'Owner / host',
  allowCreateLead = true,
  defaultProfileId,
  onCreatedLead,
}: SchedulePersonPickerProps) {
  const [q, setQ] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [search, { data: people = [], isFetching }] = useLazySearchCrmSchedulePeopleQuery()
  const [createLead, { isLoading: creating }] = useCreateCrmLeadMutation()

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void search({ q: q.trim() || undefined, limit: 20 })
    }, 250)
    return () => window.clearTimeout(handle)
  }, [q, search])

  const openCreateLead = () => setCreateOpen(true)

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">{label}</span>
      {value ? (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{value.hostName}</p>
            {value.identity ? <p className="text-xs text-slate-500 dark:text-slate-400">{value.identity}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[10px] font-black tracking-wider text-slate-500 uppercase"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-[#101826]">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search cards or saved guests…"
              className="w-full bg-transparent text-sm font-medium outline-none dark:text-white"
            />
          </label>
          <div className="max-h-44 overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
            {isFetching ? (
              <p className="px-3 py-3 text-xs font-medium text-slate-400">Searching…</p>
            ) : people.length === 0 ? (
              <p className="px-3 py-3 text-xs font-medium text-slate-400">
                No matches. Add them as a CRM lead to book this session.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-white/5">
                {people.map((person) => {
                  const selectable = Boolean(person.profileId)
                  return (
                    <li key={person.id}>
                      <button
                        type="button"
                        disabled={!selectable}
                        onClick={() => {
                          const next = selectionFromSchedulePerson(person)
                          if (next) onChange(next)
                        }}
                        className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left hover:bg-slate-50 disabled:opacity-40 dark:hover:bg-white/5"
                      >
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {person.name}
                          <span className="ml-2 text-[9px] font-black tracking-wider text-slate-400 uppercase">
                            {person.kind}
                          </span>
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">{person.subtitle}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {allowCreateLead ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            openCreateLead()
          }}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-[11px] font-black tracking-wider text-indigo-700 uppercase dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-200"
        >
          <UserPlus className="h-3.5 w-3.5" />
          {value ? 'Add a different lead' : 'Add a new lead'}
        </button>
      ) : null}

      <AddCrmLeadModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        isSubmitting={creating}
        overlayClassName="z-[11000]"
        initialFullName={q.trim()}
        subtitle="We’ll save them in CRM, then attach this booking to their card so the owner gets the invite."
        onSubmit={async (payload) => {
          const profileId = defaultProfileId || payload.profileId
          const lead = await createLead({ ...payload, profileId }).unwrap()
          notify.info(`${lead.fullName} is in CRM. This session is now attached to their card.`)
          onChange(selectionFromCreatedLead(lead))
          onCreatedLead?.(lead)
          setQ('')
          setCreateOpen(false)
        }}
      />
    </div>
  )
}
