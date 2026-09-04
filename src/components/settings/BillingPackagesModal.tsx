'use client'

import { AlertModal } from '@/components/AlertModal'
import { Modal } from '@/components/ui/Modal'
import { isMandatoryPackageAccess } from '@/lib/packageAccess'
import { ownerModeLabel, resolveOwnerMode } from '@/lib/packageOwnerMode'
import type { OwnerPackage, OwnerPackageFeature } from '@/redux/features/profiles/profiles.api'
import { useCreateBillingCheckoutMutation } from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import { Check, Package, X } from 'lucide-react'
import { useState } from 'react'

const MAX_CARDS_FEATURE_KEY = 'max_cards'

const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((Number(cents) || 0) / 100)

function humanizeFeatureLabel(key: string) {
  return key
    .replace(/^allow_/, '')
    .replace(/^max_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatFeatureLine(feat: OwnerPackageFeature): string {
  const key = feat.featureKey.trim()
  const label = humanizeFeatureLabel(key)
  const raw = (feat.featureValue ?? '').trim()
  const isAllow = key.toLowerCase().startsWith('allow_')

  if (!raw) return label
  if (raw.toLowerCase() === 'unlimited') return `${label}: Unlimited`

  if (isAllow) {
    const on =
      isMandatoryPackageAccess(key) || raw === '1' || raw.toLowerCase() === 'true' || raw.toLowerCase() === 'yes'
    return on ? label : `${label}: No`
  }

  if (key.toLowerCase().includes('file_size')) return `${label}: ${raw} MB`
  return `${label}: ${raw}`
}

function maxCardsLabel(pkg: OwnerPackage): string | null {
  const value = pkg.features?.find((f) => f.featureKey === MAX_CARDS_FEATURE_KEY)?.featureValue
  if (value == null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return n === 1 ? '1 card' : `${n} cards`
}

function packageDetailFeatures(pkg: OwnerPackage): string[] {
  const features = pkg.features ?? []
  const lines: string[] = []
  const cards = maxCardsLabel(pkg)
  if (cards) lines.push(`Up to ${cards}`)

  for (const feat of features) {
    if (feat.featureKey === MAX_CARDS_FEATURE_KEY) continue
    lines.push(formatFeatureLine(feat))
  }
  return lines
}

type BillingPackagesModalProps = {
  open: boolean
  onClose: () => void
  packages: OwnerPackage[]
  currentPackageId?: string | null
}

export function BillingPackagesModal({ open, onClose, packages, currentPackageId }: BillingPackagesModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [errorAlert, setErrorAlert] = useState<string | null>(null)
  const [createCheckout, { isLoading }] = useCreateBillingCheckoutMutation()

  const selectedPackage = packages.find((p) => p.id === selectedId) ?? null
  const canConfirm = Boolean(selectedId && selectedId !== currentPackageId)

  const handleClose = () => {
    setSelectedId(null)
    onClose()
  }

  const handleConfirm = async () => {
    if (!canConfirm || !selectedId) return
    try {
      const result = await createCheckout({ packageId: selectedId }).unwrap()
      if (result.url) {
        window.location.assign(result.url)
        return
      }
      setSelectedId(null)
      onClose()
    } catch (error) {
      const payload =
        error && typeof error === 'object' && 'data' in error ? (error as { data?: { message?: string } }).data : null
      setErrorAlert(payload?.message || 'Could not start checkout. Contact support if this continues.')
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        labelledBy="billing-packages-title"
        describedBy="billing-packages-desc"
        className="relative flex max-h-[min(92vh,860px)] w-full max-w-lg flex-col overflow-hidden p-0 sm:max-w-3xl lg:max-w-5xl"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 rounded-full bg-slate-100 p-2 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15"
        >
          <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </button>

        <div className="border-b border-slate-200 px-6 py-5 pr-14 sm:px-8 sm:py-6 dark:border-white/10">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/10">
            <Package className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          </div>
          <h3 id="billing-packages-title" className="text-xl font-bold text-slate-900 dark:text-white">
            Available plans
          </h3>
          <p
            id="billing-packages-desc"
            className="mt-1 max-w-2xl text-[13px] leading-relaxed font-medium text-slate-500 sm:text-[14px] dark:text-slate-400"
          >
            Review plan details and choose a package. Paid plans open Stripe checkout. The signup fee is charged once on
            the first invoice only.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          {packages.length === 0 && (
            <p className="px-2 py-10 text-center text-sm text-slate-500">No packages available yet.</p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            {packages.map((pkg) => {
              const subscribed = pkg.id === currentPackageId
              const selected = pkg.id === selectedId
              const featureLines = packageDetailFeatures(pkg)

              return (
                <button
                  key={pkg.id}
                  type="button"
                  disabled={subscribed}
                  onClick={() => setSelectedId(pkg.id)}
                  className={cn(
                    'flex h-full flex-col rounded-2xl border p-4 text-left transition-colors sm:p-5',
                    subscribed &&
                      'cursor-not-allowed border-slate-100 bg-slate-50 opacity-75 dark:border-white/5 dark:bg-white/5',
                    !subscribed &&
                      selected &&
                      'border-slate-900 bg-slate-50 ring-1 ring-slate-900 dark:border-white dark:bg-white/10 dark:ring-white',
                    !subscribed &&
                      !selected &&
                      'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                        subscribed || selected
                          ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                          : 'border-slate-300 dark:border-white/20'
                      )}
                    >
                      {(subscribed || selected) && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-bold text-slate-900 dark:text-white">{pkg.name}</span>
                        <span className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                          {ownerModeLabel(pkg.ownerMode ?? resolveOwnerMode(pkg))}
                        </span>
                        {subscribed && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-800 uppercase dark:bg-emerald-500/20 dark:text-emerald-300">
                            Already subscribed
                          </span>
                        )}
                      </div>
                      {pkg.slug ? (
                        <span className="mt-1 block text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                          {pkg.slug}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {pkg.description ? (
                    <p className="mt-3 text-[13px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                      {pkg.description}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-1 border-t border-slate-100 pt-3 dark:border-white/10">
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Monthly</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{money(pkg.monthlyPrice)}/mo</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Yearly</p>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {pkg.yearlyPrice > 0 ? `${money(pkg.yearlyPrice)}/yr` : '—'}
                      </p>
                    </div>
                    {(pkg.signupFeeCents ?? 0) > 0 ? (
                      <div>
                        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Signup</p>
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          {money(pkg.signupFeeCents ?? 0)} one-time
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {featureLines.length > 0 ? (
                    <ul className="mt-4 space-y-1.5">
                      {featureLines.map((line) => (
                        <li
                          key={line}
                          className="flex items-start gap-2 text-[12px] font-medium text-slate-600 dark:text-slate-300"
                        >
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-[12px] font-medium text-slate-400">No feature details listed.</p>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:px-8 dark:border-white/10">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-[14px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canConfirm || isLoading}
            onClick={() => void handleConfirm()}
            className="flex-1 rounded-2xl bg-slate-900 py-3 text-[14px] font-semibold text-white transition-all enabled:hover:bg-slate-800 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:enabled:hover:bg-slate-100"
          >
            {isLoading
              ? 'Starting checkout…'
              : selectedPackage
                ? `Continue with ${selectedPackage.name}`
                : 'Select a plan'}
          </button>
        </div>
      </Modal>

      <AlertModal
        open={Boolean(errorAlert)}
        title="Checkout"
        description={errorAlert || ''}
        onClose={() => setErrorAlert(null)}
        confirmLabel="Got it"
      />
    </>
  )
}
