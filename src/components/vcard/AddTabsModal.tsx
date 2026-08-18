'use client'

import { Modal } from '@/components/ui/Modal'
import { normalizeNavOrderWithPinnedEnds } from '@/lib/createCardTabs'
import { getNavItemCompletionPercent } from '@/lib/vcardCompletion'
import {
  buildCustomNavItems,
  CUSTOM_TAB_ID_PREFIX,
  getDefaultEnabledNavIds,
  getEditorNavLabel,
  getNavItemGroup,
  getNavLabelOverride,
  isCustomNavItemId,
  LOCKED_NAV_ITEM_IDS,
  MIN_NAV_LABEL_LENGTH,
  NAV_BAR_NAV_ITEMS,
  NAV_ITEM_GROUPS,
  type NavBarNavItem,
} from '@/lib/vcardNavbar'
import type { VCardCustomTab, VCardData, VCardTabLabelOverrides } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { reorderByIndex } from '@/utils/reorderByIndex'
import { Check, GripVertical, Pencil, Plus, X } from 'lucide-react'
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
  return normalizeNavOrderWithPinnedEnds(ids)
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
    return getNavLabelOverride(item.id, labelOverrides) || getEditorNavLabel(item)
  }

  const draftLabel = (item: NavBarNavItem) => {
    if (Object.prototype.hasOwnProperty.call(labelOverrides, item.id)) {
      return labelOverrides[item.id]
    }
    return getEditorNavLabel(item)
  }

  const updateLabel = (id: string, value: string) => {
    setLabelOverrides((prev) => ({ ...prev, [id]: value }))
  }

  const commitLabel = (item: NavBarNavItem) => {
    const trimmed = (labelOverrides[item.id] ?? '').trim()
    if (trimmed.length < MIN_NAV_LABEL_LENGTH) {
      setLabelOverrides((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, item.id)) return prev
        const next = { ...prev }
        delete next[item.id]
        return next
      })
      return
    }
    setLabelOverrides((prev) => ({ ...prev, [item.id]: trimmed }))
    if (isCustomNavItemId(item.id)) {
      setCustomTabs((prev) => prev.map((tab) => (tab.id === item.id ? { ...tab, label: trimmed } : tab)))
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

  const enableCustomTab = (id: string) => {
    setDraftIds((prev) => (prev.includes(id) ? prev : normalizeDraft([...prev, id])))
  }

  const deleteCustomTab = (id: string) => {
    setCustomTabs((prev) => prev.filter((tab) => tab.id !== id))
    setDraftIds((prev) => prev.filter((tabId) => tabId !== id))
    setLabelOverrides((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, id)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const apply = () => {
    const normalizedIds = normalizeDraft(draftIds)
    const nextCustomTabs = customTabs.map((tab) => ({
      ...tab,
      label: getNavLabelOverride(tab.id, labelOverrides) || tab.label?.trim() || 'Custom tab',
      items: tab.items || [],
    }))
    const cleanedOverrides = Object.fromEntries(
      Object.entries(labelOverrides)
        .map(([id, label]) => [id, label.trim()] as const)
        .filter(([, label]) => label.length >= MIN_NAV_LABEL_LENGTH)
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
            Same sections, names, and order used by the builder and the public card.
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
            <p className="text-[10px] font-semibold text-slate-400">Drag to reorder tabs (use handle)</p>
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
                  className="group flex min-w-0 cursor-grab items-center gap-2 rounded-xl border border-transparent bg-white px-2.5 py-2 transition-colors hover:bg-slate-50 active:cursor-grabbing dark:bg-[#0f1420] dark:hover:bg-white/4"
                >
                  <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-600/10 text-[11px] font-black text-indigo-700 tabular-nums dark:bg-indigo-500/20 dark:text-indigo-300">
                    <span className="select-none">{orderNum}</span>
                    <button
                      type="button"
                      aria-label="Remove tab"
                      onClick={() => {
                        if (LOCKED_NAV_ITEM_IDS.has(item.id)) return
                        setDraftIds((prev) => prev.filter((x) => x !== item.id))
                      }}
                      className="absolute -top-2 -right-2 hidden h-5 w-5 touch-manipulation items-center justify-center rounded-full bg-red-50 text-red-500 shadow-sm group-hover:flex"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                  <item.icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <label className="relative min-w-0 flex-1">
                    <Pencil className="pointer-events-none absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={draftLabel(item)}
                      placeholder={getEditorNavLabel(item)}
                      onChange={(event) => updateLabel(item.id, event.target.value)}
                      onBlur={() => commitLabel(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          event.currentTarget.blur()
                        }
                      }}
                      className="w-full min-w-0 rounded-lg border border-transparent bg-transparent py-1 pr-1 pl-6 text-[12px] font-bold text-slate-800 transition outline-none focus:border-indigo-200 focus:bg-white dark:text-slate-100 dark:focus:border-indigo-500/40 dark:focus:bg-white/5"
                      aria-label={`Rename ${item.label}`}
                    />
                  </label>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-70">
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
                Add an extra section that is not in the list. Rename it in Tab order, then Apply and open it in the
                builder to add title, description, and media. Remove it from Tab order to hide it, or tap X on a chip to
                delete it.
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
          {customTabs.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {customTabs.map((tab) => {
                const enabled = draftIds.includes(tab.id)
                return (
                  <span
                    key={tab.id}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border py-1.5 pr-1.5 pl-2.5 text-[12px] font-bold',
                      enabled
                        ? 'border-teal-200 bg-white text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200'
                        : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => enableCustomTab(tab.id)}
                      className="whitespace-nowrap"
                      title={enabled ? 'Already in tab order' : 'Add this custom tab back to the order'}
                    >
                      {getNavLabelOverride(tab.id, labelOverrides) || tab.label || 'Custom tab'}
                    </button>
                    <button
                      type="button"
                      aria-label="Delete custom tab"
                      onClick={() => deleteCustomTab(tab.id)}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-current/70 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )
              })}
            </div>
          ) : null}
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
          {draftIds.length} selected - required tabs stay enabled, but you can reorder them
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDraftIds((prev) => prev.filter((id) => LOCKED_NAV_ITEM_IDS.has(id)))}
            className="rounded-xl px-3 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            Unselect all
          </button>
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
