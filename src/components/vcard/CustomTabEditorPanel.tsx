'use client'

import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { MediaFileUploader } from '@/components/media/MediaFileUploader'
import type { MediaAsset } from '@/components/MediaSourceActions'
import { MediaSourceActions } from '@/components/MediaSourceActions'
import { ReorderList } from '@/components/ReorderList'
import { CorporateOwnerContentView } from '@/components/vcard/CorporateOwnerContentView'
import { EntryAttachmentThumb } from '@/components/vcard/ExpandableEntryChrome'
import { HideOwnerMediaToggle } from '@/components/vcard/HideOwnerMediaToggle'
import { useHideOwnerSectionList } from '@/hooks/useHideOwnerSectionList'
import { stripHtml } from '@/lib/htmlText'
import { customTabHideOwnerSectionKey } from '@/lib/memberMediaVisibility'
import type { VCardCustomTab, VCardCustomTabItem } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { GripVertical, Image as ImageIcon, Layers, Link2, Plus, Trash2, Type } from 'lucide-react'

const inputClasses =
  'w-full rounded-[16px] border border-slate-200/80 bg-white px-5 py-4 text-[13px] font-medium text-slate-900 shadow-sm outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white'

function createCustomItem(): VCardCustomTabItem {
  return {
    id: `custom_item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    description: '',
    url: '',
    mediaUrl: '',
    mediaName: '',
    mediaKind: 'upload',
    gallery: [],
    active: true,
  }
}

function normalizeItem(item: VCardCustomTabItem): VCardCustomTabItem {
  return {
    id: item.id || `custom_item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: item.title ?? '',
    description: item.description ?? '',
    url: item.url ?? '',
    mediaUrl: item.mediaUrl ?? '',
    mediaFrame: item.mediaFrame ?? null,
    mediaName: item.mediaName ?? '',
    mediaKind: item.mediaKind ?? 'upload',
    gallery: item.gallery ?? [],
    active: item.active !== false,
    ...(item.corporateOwned ? { corporateOwned: true as const } : {}),
  }
}

type CustomTabEditorPanelProps = {
  tab: VCardCustomTab
  cardId?: string | null
  onChange: (next: VCardCustomTab) => void
}

export function CustomTabEditorPanel({ tab, cardId, onChange }: CustomTabEditorPanelProps) {
  const items = (tab.items || []).map(normalizeItem)
  const sectionKey = customTabHideOwnerSectionKey(tab.id)
  const tabLocked = Boolean(tab.corporateOwned)

  const updateTab = (patch: Partial<VCardCustomTab>) => onChange({ ...tab, items, ...patch })

  const setItems = (next: VCardCustomTabItem[]) => updateTab({ items: next.map(normalizeItem) })

  const { hideOwner, hasOwnerItems, visibleItems, commitVisible, setHideOwner } = useHideOwnerSectionList(
    sectionKey,
    items,
    setItems
  )

  const addItem = () => commitVisible([createCustomItem(), ...visibleItems])

  const removeItem = (id: string) => {
    const target = items.find((item) => item.id === id)
    if (target?.corporateOwned) return
    commitVisible(visibleItems.filter((item) => item.id !== id))
  }

  const updateItem = <K extends keyof VCardCustomTabItem>(id: string, field: K, value: VCardCustomTabItem[K]) => {
    const target = items.find((item) => item.id === id)
    if (target?.corporateOwned) return
    commitVisible(visibleItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const patchItem = (id: string, patch: Partial<VCardCustomTabItem>) => {
    const target = items.find((item) => item.id === id)
    if (target?.corporateOwned) return
    commitVisible(visibleItems.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const applyMediaAsset = (id: string, asset: MediaAsset) => {
    const target = items.find((item) => item.id === id)
    if (target?.corporateOwned) return
    commitVisible(
      visibleItems.map((item) =>
        item.id === id
          ? {
              ...item,
              mediaUrl: asset.url,
              mediaName: asset.name,
              mediaFrame: null,
              mediaKind: asset.id.startsWith('gal_') ? 'gallery' : asset.kind,
              gallery: [
                ...(item.gallery || []),
                {
                  id: asset.id,
                  url: asset.url,
                  name: asset.name,
                  kind: asset.id.startsWith('gal_') ? 'gallery' : asset.kind,
                },
              ],
            }
          : item
      )
    )
  }

  const reorderItems = (next: VCardCustomTabItem[]) => {
    commitVisible(
      next.map((item) => {
        const prev = items.find((row) => row.id === item.id)
        return prev?.corporateOwned ? { ...item, corporateOwned: true } : item
      })
    )
  }

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col pb-12 duration-500">
      <div className="mb-8 rounded-3xl border border-teal-100 bg-teal-50/50 p-6 dark:border-teal-500/10 dark:bg-teal-500/2">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-teal-100 bg-teal-50 dark:border-teal-500/20 dark:bg-teal-500/10">
              <Layers className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-teal-600 uppercase dark:text-teal-300">
                Custom tab
              </p>
              <h3 className="text-lg font-black text-teal-700 dark:text-teal-300">{tab.label || 'Custom tab'}</h3>
              <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                Add one or more blocks. Each block has a title, rich description, featured image or video, and an
                optional link.
                {hasOwnerItems ? (
                  <> Blocks from the corporate owner stay view-only — you can still add your own content below.</>
                ) : null}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all hover:bg-teal-700 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add content
          </button>
        </div>

        <label className="mb-1.5 flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
          <Type className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          Tab name
        </label>
        <input
          type="text"
          value={tab.label}
          onChange={(event) => {
            if (tabLocked) return
            updateTab({ label: event.target.value })
          }}
          readOnly={tabLocked}
          placeholder="About us, Pricing, Case studies..."
          className={cn(inputClasses, tabLocked && 'cursor-default bg-slate-50 dark:bg-white/5')}
        />
        {tabLocked ? (
          <p className="mt-2 text-[12px] font-medium text-slate-500 dark:text-slate-400">
            Tab name comes from the corporate owner and cannot be changed on this member card.
          </p>
        ) : null}
        {hasOwnerItems ? (
          <HideOwnerMediaToggle
            checked={hideOwner}
            label="Only show my content"
            detail="Corporate owner blocks stay saved. This card’s editor and public page show only the blocks you added."
            onChange={setHideOwner}
          />
        ) : null}
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded-4xl border border-dashed border-slate-200 bg-slate-50/60 p-12 text-center shadow-sm dark:border-white/10 dark:bg-white/2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
            <ImageIcon className="h-8 w-8 text-slate-400" />
          </div>
          <h4 className="mb-2 text-[16px] font-black text-slate-900 dark:text-white">
            {hideOwner && hasOwnerItems ? 'Owner content hidden' : 'No content yet'}
          </h4>
          <p className="mx-auto mb-6 max-w-md text-[13px] text-slate-500 dark:text-slate-400">
            {hideOwner && hasOwnerItems
              ? 'Corporate owner blocks are hidden on this card. Add your own content below.'
              : 'Add a block with a title, rich description, and a featured image or video.'}
          </p>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-teal-700 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add content
          </button>
        </div>
      ) : (
        <ReorderList
          items={visibleItems}
          getKey={(item) => item.id}
          onReorder={reorderItems}
          className="space-y-8"
          renderItem={(item, _index, dragHandleProps) => (
            <section className="group/card overflow-visible rounded-4xl border border-slate-200/50 bg-slate-50/50 shadow-sm transition-all hover:border-slate-200/80 hover:bg-slate-50 dark:border-white/5 dark:bg-white/2">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
                <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                  {!item.corporateOwned ? (
                    <span
                      {...dragHandleProps}
                      className={cn(
                        'flex h-9 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-300',
                        dragHandleProps.className
                      )}
                    >
                      <GripVertical className="h-4 w-4" aria-hidden />
                    </span>
                  ) : (
                    <span className="flex h-9 w-7 shrink-0" />
                  )}
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <EntryAttachmentThumb url={item.mediaUrl} />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-[16px] font-black text-slate-900 dark:text-white">
                        {item.title || 'New content'}
                      </h4>
                      <p className="mt-0.5 truncate text-[12px] font-medium text-slate-500 dark:text-slate-400">
                        {[
                          stripHtml(item.description || '').slice(0, 64),
                          item.corporateOwned ? 'Corporate team owner' : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>
                </div>
                {!item.corporateOwned ? (
                  <button
                    type="button"
                    data-no-dnd
                    onClick={() => removeItem(item.id)}
                    className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 font-bold text-red-500 opacity-0 transition-all group-hover/card:opacity-100 hover:bg-red-100 hover:text-red-600 focus:opacity-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                ) : null}
              </div>

              <div className="p-4 sm:p-8">
                {item.corporateOwned ? (
                  <CorporateOwnerContentView
                    lines={[item.title, stripHtml(item.description || '').slice(0, 280), item.url]}
                    imageUrl={item.mediaUrl}
                  />
                ) : (
                  <>
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="group flex flex-col space-y-1.5">
                        <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                          Title
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(event) => updateItem(item.id, 'title', event.target.value)}
                          placeholder="Enter title"
                          className={inputClasses}
                        />
                        <label className="mt-4 flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                          <Link2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                          Optional link
                        </label>
                        <input
                          type="url"
                          value={item.url}
                          onChange={(event) => updateItem(item.id, 'url', event.target.value)}
                          placeholder="https://"
                          className={inputClasses}
                        />
                      </div>
                      <MediaFileUploader
                        label="Featured image or video"
                        accent="teal"
                        profileId={cardId}
                        attachmentType={tab.label || 'Custom tab'}
                        value={item.mediaUrl}
                        fileName={item.mediaName}
                        mediaFrame={item.mediaFrame}
                        onMediaFrameChange={(mediaFrame) => patchItem(item.id, { mediaFrame })}
                        accept="image/*,video/*"
                        hint="Upload image/video, paste URL, or choose from Canva/Gallery below"
                        onChange={(next) => {
                          patchItem(item.id, {
                            mediaUrl: next?.url || '',
                            mediaName: next?.fileName || '',
                            mediaKind: 'upload',
                            mediaFrame: null,
                          })
                        }}
                      />
                    </div>

                    <div className="mb-8">
                      <label className="mb-1.5 block pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        Description
                      </label>
                      <RichTextEditor
                        value={item.description}
                        onChange={(html) => updateItem(item.id, 'description', html)}
                        placeholder="Write the page content for this block…"
                      />
                    </div>

                    <div className="mb-8 rounded-2xl border border-dashed border-teal-200 bg-white/70 p-4 dark:border-teal-500/20 dark:bg-white/3">
                      <p className="mb-3 text-[11px] font-black tracking-widest text-slate-400 uppercase">
                        Media sources
                      </p>
                      <MediaSourceActions
                        mode="both"
                        compact
                        profileId={cardId}
                        onSelect={(asset) => applyMediaAsset(item.id, asset)}
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="group flex cursor-pointer items-center gap-3">
                        <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400">Active</span>
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={item.active}
                            onChange={(event) => updateItem(item.id, 'active', event.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={cn(
                              'relative h-5.5 w-9.5 rounded-xl shadow-inner transition-colors',
                              item.active ? 'bg-green-500' : 'bg-slate-200 dark:bg-white/10'
                            )}
                          >
                            <div
                              className={cn(
                                'absolute top-0.75 left-0.75 h-4 w-4 rounded-[10px] bg-white shadow transition-transform',
                                item.active && 'translate-x-4'
                              )}
                            />
                          </div>
                        </div>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}
        />
      )}
    </div>
  )
}
