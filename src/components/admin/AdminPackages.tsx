'use client'

import { ConfirmModal } from '@/components/ConfirmModal'
import { ModalPortal } from '@/components/ModalPortal'
import { notify } from '@/lib/toast/toast'
import {
  useCreateAdminPackageMutation,
  useDeleteAdminPackageMutation,
  useGetAdminPackageQuery,
  useGetAdminPackagesQuery,
  useUpdateAdminPackageMutation,
  type AdminPackageRow,
  type UpsertAdminPackageBody,
} from '@/redux/features/adminPackages/adminPackages.api'
import { cn } from '@/utils/cn'
import { CheckCircle2, Edit2, Layers, Package, Plus, Trash2, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const MAX_CARDS_FEATURE_KEY = 'max_cards'

const DEFAULT_FEATURE_LABELS = [
  'Allow 2D explainer',
  'Background video upload',
  'Background music upload',
  'Intro video upload',
  'Music upload',
  'Video upload',
  'YouTube background music',
  'Extra profile fields',
  'Social links',
]

type FormState = {
  name: string
  slug: string
  description: string
  monthlyPrice: string
  yearlyPrice: string
  sortOrder: string
  isActive: boolean
  maxCards: string
  features: string[]
}

const emptyForm = (): FormState => ({
  name: '',
  slug: '',
  description: '',
  monthlyPrice: '0',
  yearlyPrice: '0',
  sortOrder: '0',
  isActive: true,
  maxCards: '',
  features: [...DEFAULT_FEATURE_LABELS],
})

function isSystemFeatureKey(key: string) {
  return key.trim().toLowerCase() === MAX_CARDS_FEATURE_KEY
}

/** Turn snake_case / kebab-case keys into readable labels; leave already-plain text alone. */
function humanizeFeatureLabel(key: string) {
  const trimmed = key.trim()
  if (!trimmed) return ''
  if (!/[_-]/.test(trimmed) && /[A-Z]/.test(trimmed[0])) return trimmed
  if (!/[_-]/.test(trimmed)) return trimmed
  const words = trimmed
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => {
      const lower = w.toLowerCase()
      if (lower === '2d') return '2D'
      if (lower === 'yt') return 'YouTube'
      if (lower === 'bg') return 'background'
      if (lower === 'mb') return 'MB'
      return lower
    })
  if (words.length === 0) return trimmed
  const first = words[0]
  const titled = [first.charAt(0).toUpperCase() + first.slice(1), ...words.slice(1)]
  return titled.join(' ')
}

function marketingFeatures(pkg: AdminPackageRow) {
  return pkg.features.filter((f) => !isSystemFeatureKey(f.featureKey))
}

function formFromPackage(pkg: AdminPackageRow): FormState {
  const maxCardsFeat = pkg.features.find((f) => isSystemFeatureKey(f.featureKey))
  const labels = marketingFeatures(pkg).map((f) => humanizeFeatureLabel(f.featureKey))
  return {
    name: pkg.name,
    slug: pkg.slug || '',
    description: pkg.description || '',
    monthlyPrice: String(pkg.monthlyPrice),
    yearlyPrice: String(pkg.yearlyPrice),
    sortOrder: String(pkg.sortOrder),
    isActive: pkg.isActive,
    maxCards: maxCardsFeat?.featureValue?.trim() || '',
    features: labels.length > 0 ? labels : [''],
  }
}

function toBody(form: FormState): UpsertAdminPackageBody {
  const marketing = form.features
    .map((text) => text.trim())
    .filter(Boolean)
    .filter((text) => !isSystemFeatureKey(text))
    .map((featureKey) => ({ featureKey, featureValue: null as string | null }))

  const maxCardsNum = Math.max(0, Math.round(Number(form.maxCards)))
  const features =
    form.maxCards.trim() !== '' && Number.isFinite(maxCardsNum)
      ? [...marketing, { featureKey: MAX_CARDS_FEATURE_KEY, featureValue: String(maxCardsNum) }]
      : marketing

  return {
    name: form.name.trim(),
    slug: form.slug.trim() || null,
    description: form.description.trim() || null,
    monthlyPrice: Math.max(0, Math.round(Number(form.monthlyPrice) || 0)),
    yearlyPrice: Math.max(0, Math.round(Number(form.yearlyPrice) || 0)),
    sortOrder: Math.max(0, Math.round(Number(form.sortOrder) || 0)),
    isActive: form.isActive,
    features,
  }
}

function formatMoney(centsOrUnits: number) {
  return `$${centsOrUnits}`
}

export default function AdminPackages() {
  const { data: packages = [], isLoading, isError, refetch } = useGetAdminPackagesQuery()
  const [createPackage, { isLoading: creating }] = useCreateAdminPackageMutation()
  const [updatePackage, { isLoading: updating }] = useUpdateAdminPackageMutation()
  const [deletePackage] = useDeleteAdminPackageMutation()

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [subscribersId, setSubscribersId] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    onConfirm: () => void
  } | null>(null)

  const { data: packageDetail, isLoading: detailLoading } = useGetAdminPackageQuery(subscribersId!, {
    skip: !subscribersId,
  })

  const saving = creating || updating

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setModalMode('create')
  }

  const openEdit = (pkg: AdminPackageRow) => {
    setEditingId(pkg.id)
    setForm(formFromPackage(pkg))
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = toBody(form)
    if (!body.name) {
      notify.error('Package name is required')
      return
    }
    try {
      if (modalMode === 'create') {
        await createPackage(body).unwrap()
        notify.success('Package created')
      } else if (editingId) {
        await updatePackage({ id: editingId, body }).unwrap()
        notify.success('Package updated')
      }
      closeModal()
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message || 'Failed to save package'
      notify.error(message)
    }
  }

  const handleDelete = (pkg: AdminPackageRow) => {
    setConfirmState({
      open: true,
      title: pkg.subscriberCount > 0 ? 'Deactivate package?' : 'Delete subscription package?',
      description:
        pkg.subscriberCount > 0
          ? `“${pkg.name}” has ${pkg.subscriberCount} subscriber(s). Delete is blocked — deactivate it instead.`
          : `Permanently delete “${pkg.name}”? This cannot be undone.`,
      confirmLabel: pkg.subscriberCount > 0 ? 'Deactivate' : 'Delete',
      onConfirm: () => {
        void (async () => {
          try {
            if (pkg.subscriberCount > 0) {
              await updatePackage({ id: pkg.id, body: { isActive: false } }).unwrap()
              notify.success('Package deactivated')
            } else {
              await deletePackage(pkg.id).unwrap()
              notify.success('Package deleted')
            }
          } catch (err) {
            const message = (err as { data?: { message?: string } })?.data?.message || 'Failed to delete package'
            notify.error(message)
          } finally {
            setConfirmState(null)
          }
        })()
      },
    })
  }

  const sorted = useMemo(
    () => [...packages].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [packages]
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_packages')
    }
  }, [])

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-8 p-6 duration-500 md:p-10">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center dark:border-white/5">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            <Package className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Packages & Upgrades
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-400 md:text-sm">
            Create and manage subscription packages, feature lists, pricing, and subscriber counts. The first active
            package (lowest sort order) is auto-assigned to new corporate owners — set{' '}
            <span className="font-bold text-slate-500 dark:text-slate-300">Max cards</span> on the package to control
            their card limit.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-black tracking-wider text-white uppercase shadow-sm transition hover:bg-indigo-700 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Create Package
        </button>
      </div>

      {isLoading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-[#0b0f19]">
          Loading packages…
        </div>
      )}

      {isError && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-500/20 dark:bg-rose-500/10">
          <p className="text-sm font-bold text-rose-600">Failed to load packages.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && sorted.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-white/10 dark:bg-[#0b0f19]">
          <Layers className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No packages yet</p>
          <p className="mt-1 text-xs text-slate-400">Create your first subscription package to get started.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {sorted.map((pkg) => (
          <div
            key={pkg.id}
            className="relative flex flex-col justify-between rounded-4xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-white/10 dark:bg-[#0b0f19]"
          >
            <div>
              <div className="mb-5 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'rounded-full border px-3 py-1 text-[10px] font-black uppercase',
                    pkg.isActive
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5'
                  )}
                >
                  {pkg.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  type="button"
                  onClick={() => setSubscribersId(pkg.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition hover:text-indigo-500"
                >
                  <Users className="h-3.5 w-3.5" />
                  {pkg.subscriberCount} subscribers
                </button>
              </div>

              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">{pkg.name}</h3>
              {pkg.description && (
                <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-400">{pkg.description}</p>
              )}

              <div className="mt-5 mb-5 flex flex-wrap items-baseline gap-4">
                <div>
                  <span className="text-3xl font-black text-slate-950 dark:text-white">
                    {formatMoney(pkg.monthlyPrice)}
                  </span>
                  <span className="text-sm font-bold text-slate-400"> / mo</span>
                </div>
                <div className="text-sm font-bold text-slate-400">{formatMoney(pkg.yearlyPrice)} / yr</div>
              </div>

              <div className="my-4 h-px bg-slate-100 dark:bg-white/5" />

              <div className="mb-6 space-y-2">
                {marketingFeatures(pkg).length === 0 && (
                  <p className="text-xs font-semibold text-slate-400">No features listed</p>
                )}
                {marketingFeatures(pkg).map((feat) => (
                  <div
                    key={feat.id || feat.featureKey}
                    className="flex items-start gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{humanizeFeatureLabel(feat.featureKey)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 border-t border-slate-100 pt-5 dark:border-white/5">
              <button
                type="button"
                onClick={() => openEdit(pkg)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-slate-900 py-3.5 text-xs font-black tracking-wider text-white uppercase transition-all active:scale-95 dark:bg-white dark:text-slate-950"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(pkg)}
                className="flex items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3.5 text-rose-600 transition-all hover:bg-rose-100"
                title="Delete package"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalMode && (
        <ModalPortal>
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
            <div className="animate-in zoom-in-95 relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl duration-200 dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
                    <Layers className="h-5 w-5 text-indigo-600" />
                    {modalMode === 'create' ? 'Create Package' : 'Edit Package'}
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Set pricing, status, max cards, and the features shown for this plan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Slug</label>
                    <input
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                      placeholder="auto-from-name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Sort order</label>
                    <input
                      type="number"
                      min={0}
                      value={form.sortOrder}
                      onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Description</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Monthly price
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={form.monthlyPrice}
                      onChange={(e) => setForm((f) => ({ ...f, monthlyPrice: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Yearly price
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={form.yearlyPrice}
                      onChange={(e) => setForm((f) => ({ ...f, yearlyPrice: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Max cards</label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxCards}
                    onChange={(e) => setForm((f) => ({ ...f, maxCards: e.target.value }))}
                    placeholder="e.g. 15"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                  />
                  <p className="text-[10px] font-semibold text-slate-400">
                    Card limit for corporate owners on this package. Leave blank for no limit entitlement.
                  </p>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  Package is active / available
                </label>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Features</label>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          features: [...f.features, ''],
                        }))
                      }
                      className="text-[10px] font-black tracking-wider text-indigo-600 uppercase"
                    >
                      + Add feature
                    </button>
                  </div>
                  {form.features.map((feat, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        value={feat}
                        onChange={(e) =>
                          setForm((f) => {
                            const features = [...f.features]
                            features[idx] = e.target.value
                            return { ...f, features }
                          })
                        }
                        placeholder="Allow 2D explainer video"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            features: f.features.filter((_, i) => i !== idx),
                          }))
                        }
                        className="rounded-xl px-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-xl bg-slate-100 py-3.5 text-xs font-black tracking-wider text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-indigo-600 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : modalMode === 'create' ? 'Create' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {subscribersId && (
        <ModalPortal>
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSubscribersId(null)} />
            <div className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-white/5">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Package subscribers</h2>
                  <p className="text-xs font-semibold text-slate-400">{packageDetail?.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubscribersId(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[65vh] overflow-y-auto p-6">
                {detailLoading && <p className="text-sm font-semibold text-slate-400">Loading…</p>}
                {!detailLoading && (packageDetail?.subscribers?.length ?? 0) === 0 && (
                  <p className="text-sm font-semibold text-slate-400">No subscribers on this package.</p>
                )}
                <div className="space-y-2">
                  {packageDetail?.subscribers?.map((s) => (
                    <div
                      key={s.subscriptionId}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 dark:border-white/5"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{s.name || 'Unnamed'}</p>
                        <p className="text-xs font-semibold text-slate-400">{s.email}</p>
                      </div>
                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-black tracking-wider text-slate-500 uppercase dark:bg-white/5">
                        {s.stripeStatus || 'n/a'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {confirmState?.open && (
        <ConfirmModal
          open
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          variant="danger"
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  )
}
