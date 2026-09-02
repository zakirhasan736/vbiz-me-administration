'use client'

import { ModalPortal } from '@/components/ModalPortal'
import ProfileOwnerPicker, { type ProfileOwnerSelection } from '@/components/admin/ProfileOwnerPicker'
import { isStaffRole } from '@/constants/userRole'
import { useAppSelector } from '@/hooks/redux'
import { notify } from '@/lib/toast/toast'
import { useGetProfilesQuery } from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import { Loader2, X } from 'lucide-react'
import { useMemo, useState } from 'react'

type AddCrmLeadModalProps = {
  open: boolean
  onClose: () => void
  isSubmitting?: boolean
  onSubmit: (payload: {
    fullName: string
    email?: string
    phone?: string
    notes?: string
    profileId: string
  }) => Promise<void>
}

export function AddCrmLeadModal({ open, onClose, isSubmitting, onSubmit }: AddCrmLeadModalProps) {
  const role = useAppSelector((state) => state.user.user?.role)
  const isStaff = isStaffRole(role)
  const { data: profilesPage } = useGetProfilesQuery({ limit: 100 }, { skip: isStaff || !open })

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [owner, setOwner] = useState<ProfileOwnerSelection | null>(null)
  const [ownerCardId, setOwnerCardId] = useState('')

  const cards = useMemo(() => profilesPage?.items ?? [], [profilesPage?.items])

  if (!open) return null

  const profileId = isStaff ? owner?.profileId : ownerCardId || cards[0]?.id || ''
  const canSubmit = fullName.trim().length > 0 && Boolean(profileId) && !isSubmitting

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit || !profileId) return
    try {
      await onSubmit({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        profileId,
      })
      setFullName('')
      setEmail('')
      setPhone('')
      setNotes('')
      setOwner(null)
      setOwnerCardId('')
      onClose()
    } catch {
      notify.error('We couldn’t save this lead. Please try again.')
    }
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-200 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={onClose} />
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="animate-in slide-in-from-bottom-4 sm:zoom-in-95 relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-slate-200 bg-white shadow-2xl duration-200 sm:rounded-[28px] dark:border-white/10 dark:bg-[#0b1018]"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-white/5">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-indigo-600 uppercase dark:text-indigo-300">
                New contact
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Add a lead</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                This person stays in CRM so you can follow up. They won’t show on your card dashboard.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 px-6 py-5">
            <label className="block space-y-1.5">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Full name</span>
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-900"
                placeholder="Jane Cooper"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Phone</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-900"
                  placeholder="+1 555 0100"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-900"
                  placeholder="jane@company.com"
                />
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Note</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="h-20 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-900"
                placeholder="A private note only you can see"
              />
            </label>
            {isStaff ? (
              <ProfileOwnerPicker value={owner} onChange={setOwner} required label="Which card?" />
            ) : (
              <label className="block space-y-1.5">
                <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Which card?</span>
                <select
                  value={profileId}
                  onChange={(event) => setOwnerCardId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
                >
                  {cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name || card.slug || card.id}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="border-t border-slate-100 px-6 py-4 dark:border-white/5">
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[11px] font-semibold tracking-wide text-white uppercase transition',
                canSubmit
                  ? 'bg-slate-950 hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400'
                  : 'bg-slate-300'
              )}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save lead
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  )
}
