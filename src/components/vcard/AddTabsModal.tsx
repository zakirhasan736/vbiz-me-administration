'use client'

import { Modal } from '@/components/ui/Modal'
import { normalizeNavOrderWithPinnedEnds, normalizeNavOrderWithRequiredTabs } from '@/lib/createCardTabs'
import { getNavItemCompletionPercent } from '@/lib/vcardCompletion'
import {
  buildCustomNavItems,
  CUSTOM_TAB_ID_PREFIX,
  getDefaultEnabledNavIds,
  getEditorNavLabel,
  getNavItemGroup,
  isCustomNavItemId,
  LOCKED_NAV_ITEM_IDS,
  NAV_BAR_NAV_ITEMS,
  NAV_ITEM_GROUPS,
  type NavBarNavItem,
} from '@/lib/vcardNavbar'
import type { VCardCustomTab, VCardData, VCardTabLabelOverrides } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { reorderByIndex } from '@/utils/reorderByIndex'
import { Check, ChevronDown, ChevronUp, GripVertical, Pencil, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'

type AddTabsModalProps = {
  open: boolean
  onClose: () => void
  enabledIds: string[]
  vCardData: VCardData
  onApply: (payload: {
    nextIds: string[]
    customTabs: VCardCustomTab[]
    labelOverrides: VCardTabLabelOverrides
  }) => void
}

function normalizeDraft(ids: string[]): string[] {
  return normalizeNavOrderWithRequiredTabs(ids)
}

function customId() {
  return `${CUSTOM_TAB_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function createDraftCustomTab(label: string): VCardCustomTab {
  return {
    id: customId(),
    label,
    items: [],
  }
}

function normalizeCustomTabs(tabs?: VCardCustomTab[] | null): VCardCustomTab[] {
  return (tabs || [])
    .filter((tab) => isCustomNavItemId(tab.id))
    .map((tab) => ({
      id: tab.id,
      label: tab.label?.trim() || 'Custom tab',
      items: tab.items || [],
    }))
}

export function AddTabsModal({ open, onClose, enabledIds, vCardData, onApply }: AddTabsModalProps) {
  const [draftIds, setDraftIds] = useState<string[]>(() => normalizeDraft(enabledIds))
  const [customTabs, setCustomTabs] = useState<VCardCustomTab[]>(() => normalizeCustomTabs(vCardData.customTabs))
  const [labelOverrides, setLabelOverrides] = useState<VCardTabLabelOverrides>(() => vCardData.tabLabelOverrides || {})
  const [wasOpen, setWasOpen] = useState(open)

  // Reset draft when the modal opens (adjust during render — avoid setState-in-effect).
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setDraftIds(normalizeDraft(enabledIds))
      setCustomTabs(normalizeCustomTabs(vCardData.customTabs))
      setLabelOverrides(vCardData.tabLabelOverrides || {})
    }
  }

  const allItems = useMemo(() => [...NAV_BAR_NAV_ITEMS, ...buildCustomNavItems(customTabs)], [customTabs])

  const draftItems = useMemo(
    () =>
      draftIds
        .map((id) => allItems.find((item) => item.id === id))
        .filter((item): item is NavBarNavItem => Boolean(item)),
    [allItems, draftIds]
  )

  const toggleId = (id: string) => {
    if (LOCKED_NAV_ITEM_IDS.has(id)) return
    setDraftIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      return normalizeDraft([...prev, id])
    })
  }

  const moveDraft = (from: number, to: number) => {
    setDraftIds((prev) => normalizeDraft(reorderByIndex(prev, from, to)))
  }

  const itemLabel = (item: NavBarNavItem) => {
    return labelOverrides[item.id]?.trim() || getEditorNavLabel(item)
  }

  const updateLabel = (id: string, value: string) => {
    setLabelOverrides((prev) => ({ ...prev, [id]: value }))
    if (isCustomNavItemId(id)) {
      setCustomTabs((prev) => prev.map((tab) => (tab.id === id ? { ...tab, label: value } : tab)))
    }
  }

  const addCustomTab = () => {
    const tab = createDraftCustomTab(`Custom tab ${customTabs.length + 1}`)
    setCustomTabs((prev) => [...prev, tab])
    setLabelOverrides((prev) => ({ ...prev, [tab.id]: tab.label }))
    setDraftIds((prev) => normalizeDraft([...prev, tab.id]))
  }

  const resetDefaults = () => {
    setDraftIds(normalizeNavOrderWithPinnedEnds(getDefaultEnabledNavIds()))
    setCustomTabs(normalizeCustomTabs(vCardData.customTabs))
    setLabelOverrides({})
  }

  const apply = () => {
    const normalizedIds = normalizeDraft(draftIds)
    const activeCustomIds = new Set(normalizedIds.filter((id) => isCustomNavItemId(id)))
    const nextCustomTabs = customTabs
      .filter((tab) => activeCustomIds.has(tab.id))
      .map((tab) => ({
        ...tab,
        label: labelOverrides[tab.id]?.trim() || tab.label?.trim() || 'Custom tab',
        items: tab.items || [],
      }))
    const cleanedOverrides = Object.fromEntries(
      Object.entries(labelOverrides)
        .map(([id, label]) => [id, label.trim()] as const)
        .filter(([, label]) => Boolean(label))
    )
    onApply({ nextIds: normalizedIds, customTabs: nextCustomTabs, labelOverrides: cleanedOverrides })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      overlayClassName="bg-black/60"
      className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]"
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-6 py-5 sm:px-8 dark:border-white/5">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Add tab</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Same nav sections as Settings → Nav Bar. Tap pills to enable or disable.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5 sm:px-8">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Tab order</p>
            <p className="text-[10px] font-semibold text-slate-400">3 per row · drag or ↑↓</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {draftItems.map((item, index) => {
              const orderNum = index + 1
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(index))
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const from = Number(e.dataTransfer.getData('text/plain'))
                    if (!Number.isNaN(from)) moveDraft(from, index)
                  }}
                  className="flex min-w-0 cursor-grab items-center gap-2 rounded-xl border border-transparent bg-white px-2.5 py-2 transition-colors hover:bg-slate-50 active:cursor-grabbing dark:bg-[#0f1420] dark:hover:bg-white/4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-600/10 text-[11px] font-black text-indigo-700 tabular-nums dark:bg-indigo-500/20 dark:text-indigo-300">
                    {orderNum}
                  </span>
                  <item.icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <label className="relative min-w-0 flex-1">
                    <Pencil className="pointer-events-none absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={itemLabel(item)}
                      onChange={(event) => updateLabel(item.id, event.target.value)}
                      className="w-full min-w-0 rounded-lg border border-transparent bg-transparent py-1 pr-1 pl-6 text-[12px] font-bold text-slate-800 transition outline-none focus:border-indigo-200 focus:bg-white dark:text-slate-100 dark:focus:border-indigo-500/40 dark:focus:bg-white/5"
                      aria-label={`Rename ${item.label}`}
                    />
                  </label>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-70">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveDraft(index, index - 1)}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-25 dark:hover:bg-white/10"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === draftIds.length - 1}
                      onClick={() => moveDraft(index, index + 1)}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-25 dark:hover:bg-white/10"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <GripVertical className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/50 p-4 dark:border-teal-500/20 dark:bg-teal-500/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black tracking-widest text-teal-600 uppercase dark:text-teal-300">
                Custom tabs
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Add multiple flexible tabs for title, description, uploads, gallery, and Canva media.
              </p>
            </div>
            <button
              type="button"
              onClick={addCustomTab}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" /> Custom tab
            </button>
          </div>
        </div>

        {NAV_ITEM_GROUPS.map((group) => {
          const tabs = NAV_BAR_NAV_ITEMS.filter((item) => getNavItemGroup(item) === group.id)
          if (!tabs.length) return null
          return (
            <div key={group.id} className="space-y-3">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const checked = draftIds.includes(tab.id)
                  const locked = LOCKED_NAV_ITEM_IDS.has(tab.id)
                  const percent = getNavItemCompletionPercent(tab.editorPanel, vCardData)
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      disabled={locked}
                      onClick={() => toggleId(tab.id)}
                      title={tab.label}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border py-2 pr-3 pl-2.5 text-[12px] font-bold transition-all',
                        locked && 'cursor-default opacity-80',
                        checked
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 dark:border-white/10 dark:bg-white/3 dark:text-slate-300 dark:hover:border-indigo-500/40'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border',
                          checked
                            ? 'border-white bg-white text-indigo-600'
                            : 'border-slate-300 bg-white/40 dark:border-white/20 dark:bg-black/20'
                        )}
                      >
                        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <tab.icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
                      <span className="whitespace-nowrap">{itemLabel(tab)}</span>
                      {percent > 0 && (
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.5 text-[9px] font-black tabular-nums',
                            checked ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-500 dark:bg-white/10'
                          )}
                        >
                          {percent}%
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-5 sm:px-8 dark:border-white/5 dark:bg-white/2">
        <p className="text-[11px] font-semibold text-slate-500">
          {draftIds.length} selected · Personal, Global Connection, and My Info stay enabled
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetDefaults}
            className="rounded-xl px-3 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            Reset defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white hover:bg-indigo-700"
          >
            <Check className="h-4 w-4" /> Apply
          </button>
        </div>
      </div>
    </Modal>
  )
}
