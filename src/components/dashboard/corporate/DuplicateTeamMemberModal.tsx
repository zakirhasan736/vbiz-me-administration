'use client'

import PasswordRulesTags from '@/components/auth/PasswordRulesTags'
import { Modal } from '@/components/ui/Modal'
import { CORPORATE_MEMBER_DEFAULT_PASSWORD } from '@/lib/corporateMemberDefaults'
import { getPasswordRules, isPasswordSameAsEmail } from '@/utils/passwordValidation'
import { Loader, UserPlus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'

export type DuplicateTeamMemberInput = {
  name: string
  email: string
  password: string
  phone?: string
  designation?: string
}

type DuplicateTeamMemberModalProps = {
  open: boolean
  sourceCardName?: string
  isSubmitting?: boolean
  onConfirm: (input: DuplicateTeamMemberInput) => void
  onCancel: () => void
}

const fieldClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white'

export function DuplicateTeamMemberModal({
  open,
  sourceCardName,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: DuplicateTeamMemberModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState(CORPORATE_MEMBER_DEFAULT_PASSWORD)
  const [phone, setPhone] = useState('')
  const [designation, setDesignation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [prevOpen, setPrevOpen] = useState(open)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setName('')
      setEmail('')
      setPassword(CORPORATE_MEMBER_DEFAULT_PASSWORD)
      setPhone('')
      setDesignation('')
      setError(null)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return

    const nextName = name.trim()
    const nextEmail = email.trim().toLowerCase()
    const nextPassword = password.trim() || CORPORATE_MEMBER_DEFAULT_PASSWORD
    const nextPhone = phone.trim()
    const nextDesignation = designation.trim()

    if (!nextName) {
      setError('Full name is required.')
      return
    }
    if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setError('A valid email is required for the member login.')
      return
    }
    const unmet = getPasswordRules(nextPassword).find((rule) => !rule.met)
    if (unmet) {
      setError(`Password requires: ${unmet.label}.`)
      return
    }
    if (isPasswordSameAsEmail(nextPassword, nextEmail)) {
      setError("Password can't be the same as email.")
      return
    }

    setError(null)
    onConfirm({
      name: nextName,
      email: nextEmail,
      password: nextPassword,
      ...(nextPhone ? { phone: nextPhone } : {}),
      ...(nextDesignation ? { designation: nextDesignation } : {}),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      preventClose={isSubmitting}
      labelledBy="duplicate-team-member-title"
      describedBy="duplicate-team-member-description"
      className="relative max-w-lg p-6 sm:p-8"
    >
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="absolute top-4 right-4 rounded-xl p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-white/10"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/10">
        <UserPlus className="h-7 w-7 text-slate-700 dark:text-slate-200" />
      </div>

      <h3
        id="duplicate-team-member-title"
        className="mb-2 text-center text-xl font-bold text-slate-900 dark:text-white"
      >
        New team member card
      </h3>
      <p
        id="duplicate-team-member-description"
        className="mb-5 text-center text-[13px] leading-relaxed font-medium text-slate-500 dark:text-slate-400"
      >
        {sourceCardName
          ? `Duplicate “${sourceCardName}” and create a login for this member. They get their own backoffice for this card; you keep corporate management.`
          : 'Create a login for this member. They get their own backoffice for this card; you keep corporate management.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="duplicate-member-name"
            className="mb-1.5 block text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400"
          >
            Full name
          </label>
          <input
            id="duplicate-member-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            placeholder="Jacky Hernandez"
            autoFocus
            disabled={isSubmitting}
            autoComplete="name"
          />
        </div>

        <div>
          <label
            htmlFor="duplicate-member-email"
            className="mb-1.5 block text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400"
          >
            Login email
          </label>
          <input
            id="duplicate-member-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            placeholder="jacky@company.com"
            disabled={isSubmitting}
            autoComplete="email"
          />
        </div>

        <div>
          <label
            htmlFor="duplicate-member-password"
            className="mb-1.5 block text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400"
          >
            Login password
          </label>
          <input
            id="duplicate-member-password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
            disabled={isSubmitting}
            autoComplete="new-password"
          />
          <p className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Prefilled with the default password ({CORPORATE_MEMBER_DEFAULT_PASSWORD}). Clear the field to keep that
            default, or set a custom password. The member can change it later in Settings.
          </p>
          <PasswordRulesTags password={password} email={email} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="duplicate-member-title"
              className="mb-1.5 block text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400"
            >
              Title <span className="font-medium tracking-normal normal-case">(optional)</span>
            </label>
            <input
              id="duplicate-member-title"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className={fieldClass}
              placeholder="Executive Assistant"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label
              htmlFor="duplicate-member-phone"
              className="mb-1.5 block text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400"
            >
              Phone <span className="font-medium tracking-normal normal-case">(optional)</span>
            </label>
            <input
              id="duplicate-member-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={fieldClass}
              placeholder="+1…"
              disabled={isSubmitting}
              autoComplete="tel"
            />
          </div>
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </p>
        ) : null}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-[14px] font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-[14px] font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Creating…' : 'Duplicate card'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
