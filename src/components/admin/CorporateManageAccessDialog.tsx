'use client'

import { ModalPortal } from '@/components/ModalPortal'
import {
  compactFeatureOverrides,
  formatGlobalFeatureDefault,
  humanizeFeatureLabel,
  isBooleanPackageFeature,
  overridablePackageFeatures,
  overrideValue,
  setOverride,
  type FeatureRow,
} from '@/lib/packageFeatureUi'
import { Settings2, X } from 'lucide-react'

type CorporateManageAccessDialogProps = {
  open: boolean
  onClose: () => void
  packageFeatures: FeatureRow[]
  overrides: FeatureRow[]
  onSave: (overrides: FeatureRow[]) => void
}

export type CorporateManageAccessFieldsProps = Pick<
  CorporateManageAccessDialogProps,
  'packageFeatures' | 'overrides' | 'onSave'
>

function booleanMode(value: string | null): 'inherit' | '1' | '0' {
  if (value == null) return 'inherit'
  const lower = value.trim().toLowerCase()
  if (lower === '0' || lower === 'false' || lower === 'no' || lower === 'off') return '0'
  return '1'
}

function numericMode(value: string | null): 'inherit' | 'unlimited' | 'custom' {
  if (value == null) return 'inherit'
  const lower = value.trim().toLowerCase()
  if (lower === 'unlimited' || lower === '-1') return 'unlimited'
  return 'custom'
}

export function CorporateManageAccessFields({ packageFeatures, overrides, onSave }: CorporateManageAccessFieldsProps) {
  const features = overridablePackageFeatures(packageFeatures)

  if (features.length === 0) {
    return <p className="text-sm font-semibold text-slate-500">This package has no overridable features yet.</p>
  }

  return (
    <div className="space-y-3">
      {features.map((feature) => {
        const current = overrideValue(overrides, feature.featureKey)
        const booleanFeature = isBooleanPackageFeature(feature.featureKey)

        return (
          <div
            key={feature.featureKey}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/50"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {humanizeFeatureLabel(feature.featureKey)}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  Global: {formatGlobalFeatureDefault(feature)}
                </p>
              </div>
              {booleanFeature ? (
                <select
                  value={booleanMode(current)}
                  onChange={(event) => {
                    const next = event.target.value as 'inherit' | '1' | '0'
                    onSave(setOverride(overrides, feature.featureKey, next === 'inherit' ? null : next))
                  }}
                  className="w-48 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                >
                  <option value="inherit">Use Global Default</option>
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              ) : (
                <div className="flex min-w-[12rem] flex-col gap-2">
                  <select
                    value={numericMode(current)}
                    onChange={(event) => {
                      const next = event.target.value as 'inherit' | 'unlimited' | 'custom'
                      if (next === 'inherit') {
                        onSave(setOverride(overrides, feature.featureKey, null))
                        return
                      }
                      if (next === 'unlimited') {
                        onSave(setOverride(overrides, feature.featureKey, 'unlimited'))
                        return
                      }
                      onSave(
                        setOverride(
                          overrides,
                          feature.featureKey,
                          current && numericMode(current) === 'custom' ? current : '0'
                        )
                      )
                    }}
                    className="w-48 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="inherit">Use Global Default</option>
                    <option value="custom">Custom Number</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                  {numericMode(current) === 'custom' ? (
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={current ?? '0'}
                      onChange={(event) =>
                        onSave(
                          setOverride(
                            overrides,
                            feature.featureKey,
                            event.target.value.trim() === '' ? '0' : event.target.value.trim()
                          )
                        )
                      }
                      className="w-48 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function CorporateManageAccessDialog({
  open,
  onClose,
  packageFeatures,
  overrides,
  onSave,
}: CorporateManageAccessDialogProps) {
  if (!open) return null

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
        <div className="animate-in zoom-in-95 relative max-h-[90vh] w-full max-w-2xl overflow-hidden overflow-y-auto rounded-4xl border border-slate-200 bg-white p-6 shadow-2xl duration-200 dark:border-white/10 dark:bg-[#0b0f19]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                <Settings2 className="h-5 w-5 text-indigo-600" /> Manage Access
              </h3>
              <p className="mt-1 text-[12px] font-semibold text-slate-400">
                Leave a feature on Use Global Default to follow the Corporate package.
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

          <div className="mt-5">
            <CorporateManageAccessFields packageFeatures={packageFeatures} overrides={overrides} onSave={onSave} />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
            <p className="mr-auto self-center text-[11px] font-semibold text-slate-400">
              {compactFeatureOverrides(overrides).length} override
              {compactFeatureOverrides(overrides).length === 1 ? '' : 's'} stored
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black tracking-wider text-white uppercase hover:bg-indigo-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
