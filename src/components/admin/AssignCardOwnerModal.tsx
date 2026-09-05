'use client'

import { AdminPasswordField } from '@/components/admin/AdminPasswordField'
import PasswordRulesTags from '@/components/auth/PasswordRulesTags'
import { Modal } from '@/components/ui/Modal'
import type { CreateCardOwnerSession } from '@/lib/admin/createCardOwner'
import { isRetiredPackage } from '@/lib/packageAccess'
import { ownerModeLabel, parsePackageMaxCards, resolveOwnerMode } from '@/lib/packageOwnerMode'
import { notify } from '@/lib/toast/toast'
import { useGetAdminPackagesQuery } from '@/redux/features/adminPackages/adminPackages.api'
import {
  useCreateAdminUserMutation,
  useGetAdminUsersQuery,
  type AdminUserRow,
} from '@/redux/features/adminUsers/adminUsers.api'
import { cn } from '@/utils/cn'
import { getPasswordRules, isPasswordSameAsEmail } from '@/utils/passwordValidation'
import { Building, Check, Search, User, UserPlus, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'

function rtkErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (
      err as {
        data?: { message?: string; errorMessages?: { path?: string; message?: string }[] }
      }
    ).data
    const validationDetails = data?.errorMessages
      ?.map((item) => {
        const message = item.message?.trim()
        if (!message) return null
        return item.path?.trim() ? `${item.path}: ${message}` : message
      })
      .filter((message): message is string => Boolean(message))
    if (validationDetails?.length) return validationDetails.join(' · ')
    if (data?.message) return data.message
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}

function centsToDollarsInput(cents: number | null | undefined): string {
  if (cents == null) return ''
  const dollars = Math.max(0, Number(cents) || 0) / 100
  return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2)
}

function dollarsInputToCents(value: string): number {
  return Math.max(0, Math.round((Number(value) || 0) * 100))
}

function formatMoney(cents: number | null | undefined) {
  if (cents == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Math.max(0, Number(cents) || 0) / 100
  )
}

type OwnerRole = 'vcard-owner' | 'corporate-owner'
type TabId = 'existing' | 'new'

type AssignCardOwnerModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: (owner: CreateCardOwnerSession) => void
}

function isOwnerRole(role: string): role is OwnerRole {
  return role === 'vcard-owner' || role === 'corporate-owner'
}

function toSession(user: Pick<AdminUserRow, 'id' | 'name' | 'email' | 'role'>): CreateCardOwnerSession {
  return {
    userId: user.id,
    name: user.name?.trim() || user.email,
    email: user.email,
    role: user.role,
  }
}

function roleLabel(role: string) {
  if (role === 'corporate-owner') return 'Corporate'
  if (role === 'vcard-owner') return 'Single'
  return role
}

export default function AssignCardOwnerModal({ open, onClose, onConfirm }: AssignCardOwnerModalProps) {
  const [tab, setTab] = useState<TabId>('existing')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [selected, setSelected] = useState<CreateCardOwnerSession | null>(null)

  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newPackageId, setNewPackageId] = useState('')
  const [newCardLimit, setNewCardLimit] = useState('')
  const [newNegotiatedMonthly, setNewNegotiatedMonthly] = useState('')
  const [newNegotiatedSignup, setNewNegotiatedSignup] = useState('')
  const [newFreePeriodAmount, setNewFreePeriodAmount] = useState('')
  const [newFreePeriodUnit, setNewFreePeriodUnit] = useState<'days' | 'months' | 'years'>('days')
  const [newFreePeriodLifetime, setNewFreePeriodLifetime] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)

  const [createUser, { isLoading: isCreating }] = useCreateAdminUserMutation()
  const { data: packages = [], isLoading: isPackagesLoading } = useGetAdminPackagesQuery(undefined, {
    skip: !open,
  })
  const provisionPackages = useMemo(() => packages.filter((pkg) => pkg.isActive && !isRetiredPackage(pkg)), [packages])
  const selectedPackage = provisionPackages.find((pkg) => pkg.id === newPackageId) || null
  const selectedOwnerMode = selectedPackage ? resolveOwnerMode(selectedPackage) : null
  const createMonthlyCents =
    newNegotiatedMonthly.trim() !== ''
      ? dollarsInputToCents(newNegotiatedMonthly)
      : (selectedPackage?.monthlyPrice ?? 0)
  const createSignupFeeCents =
    newNegotiatedSignup.trim() !== ''
      ? dollarsInputToCents(newNegotiatedSignup)
      : (selectedPackage?.signupFeeCents ?? 0)
  const createFirstInvoiceCents = createMonthlyCents + createSignupFeeCents
  const packageCardDefault = selectedPackage ? parsePackageMaxCards(selectedPackage.features) : null

  const resetNewUserForm = () => {
    setNewName('')
    setNewEmail('')
    setNewPassword('')
    setNewPasswordConfirm('')
    setNewCompany('')
    setNewPackageId('')
    setNewCardLimit('')
    setNewNegotiatedMonthly('')
    setNewNegotiatedSignup('')
    setNewFreePeriodAmount('')
    setNewFreePeriodUnit('days')
    setNewFreePeriodLifetime(false)
  }

  // Reset form when the modal opens (adjust during render — avoid setState-in-effect).
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setTab('existing')
      setSearchQuery('')
      setDebouncedQ('')
      setSelected(null)
      resetNewUserForm()
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchQuery.trim()), 300)
    return () => window.clearTimeout(t)
  }, [searchQuery])

  const listQuery = useMemo(
    () => ({
      q: debouncedQ || undefined,
      accountStatus: 'ACTIVE' as const,
      skip: 0,
      limit: 20,
    }),
    [debouncedQ]
  )

  const { data, isLoading, isFetching, isError } = useGetAdminUsersQuery(listQuery, { skip: !open })
  const owners = useMemo(() => (data?.items ?? []).filter((u) => isOwnerRole(String(u.role))), [data?.items])

  const handleContinueExisting = () => {
    if (!selected) return
    onConfirm(selected)
  }

  const handleCreateAndContinue = async (e: FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) return
    if (!newPackageId) {
      notify.error('Select a package.')
      return
    }

    const unmetPasswordRule = getPasswordRules(newPassword).find((rule) => !rule.met)
    if (unmetPasswordRule) {
      notify.error(`Password requires: ${unmetPasswordRule.label}.`)
      return
    }
    if (isPasswordSameAsEmail(newPassword, newEmail)) {
      notify.error("Password can't be the same as email.")
      return
    }
    if (newPassword !== newPasswordConfirm) {
      notify.error('Passwords do not match.')
      return
    }

    if (selectedOwnerMode === 'corporate') {
      if (!newCompany.trim()) {
        notify.error('Company / organization is required for Corporate accounts.')
        return
      }
      if (newCardLimit.trim() === '' || !Number.isFinite(Number(newCardLimit))) {
        notify.error('Enter a card / person creation limit.')
        return
      }
    }

    try {
      const user = await createUser({
        name: newName.trim(),
        email: newEmail.trim(),
        ...(newPassword.trim() ? { password: newPassword.trim() } : {}),
        packageId: newPackageId,
        companyName: newCompany.trim() || null,
        ...(selectedOwnerMode === 'corporate'
          ? {
              negotiatedMonthlyCents:
                newNegotiatedMonthly.trim() === '' ? null : dollarsInputToCents(newNegotiatedMonthly),
              negotiatedSignupFeeCents:
                newNegotiatedSignup.trim() === '' ? null : dollarsInputToCents(newNegotiatedSignup),
              cardLimit: Math.max(0, Math.round(Number(newCardLimit) || 0)),
            }
          : {}),
        ...(newFreePeriodLifetime || (newFreePeriodAmount.trim() && Number(newFreePeriodAmount) > 0)
          ? {
              freePeriodAmount: newFreePeriodLifetime
                ? undefined
                : Math.max(0, Math.round(Number(newFreePeriodAmount) || 0)),
              freePeriodUnit: newFreePeriodLifetime ? undefined : newFreePeriodUnit,
              freePeriodLifetime: newFreePeriodLifetime,
            }
          : {}),
      }).unwrap()
      notify.success(
        user.paymentLinkUrl
          ? 'Account created. Payment link emailed to the customer.'
          : 'Account created. Welcome email sent — billing starts when you send a payment link or the free period ends.'
      )
      onConfirm(toSession(user))
    } catch (err) {
      notify.error(rtkErrorMessage(err, 'Failed to create user.'))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-white/5">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Assign card owner</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Pick an existing owner, or create a new Corporate/Single user first, then continue to Manual or AI create.
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

      <div className="flex gap-1 border-b border-slate-100 px-6 pt-3 dark:border-white/5">
        {(
          [
            { id: 'existing' as const, label: 'Existing user', icon: User },
            { id: 'new' as const, label: 'New user', icon: UserPlus },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-black tracking-wider uppercase transition',
              tab === id
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {tab === 'existing' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/15 dark:bg-slate-800">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or company…"
                className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none dark:text-white"
              />
            </div>

            {isError ? (
              <p className="text-xs font-semibold text-rose-500">Failed to load users.</p>
            ) : isLoading || isFetching ? (
              <p className="text-xs font-semibold text-slate-400">Searching…</p>
            ) : owners.length === 0 ? (
              <p className="text-xs font-semibold text-slate-400">No active single or corporate owners found.</p>
            ) : (
              <ul className="max-h-72 space-y-1.5 overflow-y-auto">
                {owners.map((u) => {
                  const corporate = u.role === 'corporate-owner'
                  const active = selected?.userId === u.id
                  const displayName = u.name?.trim() || u.email
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(toSession(u))}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                          active
                            ? 'border-indigo-500/40 bg-indigo-500/10 dark:bg-indigo-500/15'
                            : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20'
                        )}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-50 text-sm font-black text-indigo-600 dark:border-white/5 dark:bg-slate-900 dark:text-indigo-400">
                          {(displayName[0] || '?').toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                              {displayName}
                            </span>
                            <span
                              className={cn(
                                'inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase',
                                corporate
                                  ? 'border-indigo-500/15 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                                  : 'border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-300'
                              )}
                            >
                              {corporate ? <Building className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                              {roleLabel(String(u.role))}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-400">
                            {[u.email, u.companyName].filter(Boolean).join(' · ')}
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
        ) : (
          <form id="assign-owner-new-user" onSubmit={handleCreateAndContinue} className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Package</label>
              <select
                required
                value={newPackageId}
                onChange={(e) => {
                  const id = e.target.value
                  setNewPackageId(id)
                  const pkg = provisionPackages.find((item) => item.id === id)
                  if (pkg && resolveOwnerMode(pkg) === 'corporate') {
                    const cap = parsePackageMaxCards(pkg.features)
                    setNewCardLimit(cap != null ? String(cap) : '')
                  } else {
                    setNewCardLimit('')
                  }
                  if (pkg) {
                    setNewNegotiatedMonthly(centsToDollarsInput(pkg.monthlyPrice))
                    setNewNegotiatedSignup(centsToDollarsInput(pkg.signupFeeCents))
                  } else {
                    setNewNegotiatedMonthly('')
                    setNewNegotiatedSignup('')
                  }
                }}
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
              >
                <option value="">{isPackagesLoading ? 'Loading packages…' : 'Select a package'}</option>
                {provisionPackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} — {ownerModeLabel(resolveOwnerMode(pkg))}
                  </option>
                ))}
              </select>
              {selectedOwnerMode && (
                <p className="text-[11px] font-semibold text-slate-400">
                  Back office is {ownerModeLabel(selectedOwnerMode)}. Set the customer&apos;s login password below to
                  finish provisioning in this window.
                </p>
              )}
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Full Client Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Richard Hendricks"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Client Email Address
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. richard@hooli.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                {selectedOwnerMode === 'corporate' ? 'Company / Organization' : 'Organization (optional)'}
              </label>
              <input
                type="text"
                required={selectedOwnerMode === 'corporate'}
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="e.g. Pied Piper Inc"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/60">
              <div className="mb-3">
                <p className="text-[10px] font-black tracking-wider text-slate-500 uppercase dark:text-slate-300">
                  Login credentials
                </p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  Set the initial password now so no separate configuration step is required.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AdminPasswordField
                  id="assign-owner-password"
                  label="Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  inputClassName="bg-white dark:bg-slate-800"
                />
                <AdminPasswordField
                  id="assign-owner-confirm-password"
                  label="Confirm Password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  required
                  minLength={8}
                  inputClassName="bg-white dark:bg-slate-800"
                />
              </div>
              <PasswordRulesTags password={newPassword} email={newEmail} />
              {newPasswordConfirm && newPassword !== newPasswordConfirm ? (
                <p className="mt-2 text-[11px] font-semibold text-red-500" role="alert">
                  Passwords do not match.
                </p>
              ) : null}
            </div>

            {selectedPackage && (
              <div className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/5">
                <div>
                  <p className="text-[10px] font-black tracking-wider text-indigo-700 uppercase dark:text-indigo-300">
                    Billing setup
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    Set pricing now. Payment is deferred until you generate a payment link or the complimentary period
                    ends.
                  </p>
                </div>

                {selectedOwnerMode === 'corporate' && (
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Card / person creation limit
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      required
                      value={newCardLimit}
                      onChange={(e) => setNewCardLimit(e.target.value)}
                      placeholder={packageCardDefault != null ? String(packageCardDefault) : 'e.g. 25'}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      One-time card creation fee (USD)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={newNegotiatedSignup}
                      onChange={(e) => setNewNegotiatedSignup(e.target.value)}
                      placeholder={`Default ${formatMoney(selectedPackage.signupFeeCents)}`}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Monthly subscription (USD)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={newNegotiatedMonthly}
                      onChange={(e) => setNewNegotiatedMonthly(e.target.value)}
                      placeholder={`Default ${formatMoney(selectedPackage.monthlyPrice)}`}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col space-y-1.5 sm:col-span-1">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Complimentary period
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      disabled={newFreePeriodLifetime}
                      value={newFreePeriodAmount}
                      onChange={(e) => setNewFreePeriodAmount(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none disabled:opacity-50 dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Unit</label>
                    <select
                      disabled={newFreePeriodLifetime}
                      value={newFreePeriodUnit}
                      onChange={(e) => setNewFreePeriodUnit(e.target.value as 'days' | 'months' | 'years')}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none disabled:opacity-50 dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={newFreePeriodLifetime}
                        onChange={(e) => setNewFreePeriodLifetime(e.target.checked)}
                      />
                      Lifetime free
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-900/40">
                  <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    First invoice preview
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">
                    {formatMoney(createFirstInvoiceCents)} first payment, then {formatMoney(createMonthlyCents)}
                    /month
                  </p>
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      <div className="flex gap-3 border-t border-slate-100 px-6 py-4 dark:border-white/5">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl bg-slate-100 py-3.5 text-xs font-black tracking-wider text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300"
        >
          Cancel
        </button>
        {tab === 'existing' ? (
          <button
            type="button"
            disabled={!selected}
            onClick={handleContinueExisting}
            className="flex-1 rounded-xl bg-indigo-600 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            form="assign-owner-new-user"
            disabled={isCreating || !newPackageId}
            className="flex-1 rounded-xl bg-indigo-600 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
          >
            {isCreating ? 'Creating…' : 'Create & Continue'}
          </button>
        )}
      </div>
    </Modal>
  )
}
