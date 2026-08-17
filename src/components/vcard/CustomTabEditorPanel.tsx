'use client'

import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { MediaFileUploader } from '@/components/media/MediaFileUploader'
import type { MediaAsset } from '@/components/MediaSourceActions'
import { MediaSourceActions } from '@/components/MediaSourceActions'
import type { VCardCustomTab, VCardCustomTabItem } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { Image as ImageIcon, Layers, Link2, Plus, Trash2, Type } from 'lucide-react'

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
    mediaName: item.mediaName ?? '',
    mediaKind: item.mediaKind ?? 'upload',
    gallery: item.gallery ?? [],
    active: item.active !== false,
  }
}

type CustomTabEditorPanelProps = {
  tab: VCardCustomTab
  cardId?: string | null
  onChange: (next: VCardCustomTab) => void
}

export function CustomTabEditorPanel({ tab, cardId, onChange }: CustomTabEditorPanelProps) {
  const items = (tab.items || []).map(normalizeItem)

  const updateTab = (patch: Partial<VCardCustomTab>) => onChange({ ...tab, items, ...patch })

  const setItems = (next: VCardCustomTabItem[]) => updateTab({ items: next.map(normalizeItem) })

  const addItem = () => setItems([createCustomItem(), ...items])

  const removeItem = (id: string) => setItems(items.filter((item) => item.id !== id))

  const updateItem = <K extends keyof VCardCustomTabItem>(id: string, field: K, value: VCardCustomTabItem[K]) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const patchItem = (id: string, patch: Partial<VCardCustomTabItem>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const applyMediaAsset = (id: string, asset: MediaAsset) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              mediaUrl: asset.url,
              mediaName: asset.name,
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
          onChange={(event) => updateTab({ label: event.target.value })}
          placeholder="About us, Pricing, Case studies..."
          className={inputClasses}
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-4xl border border-dashed border-slate-200 bg-slate-50/60 p-12 text-center shadow-sm dark:border-white/10 dark:bg-white/2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
            <ImageIcon className="h-8 w-8 text-slate-400" />
          </div>
          <h4 className="mb-2 text-[16px] font-black text-slate-900 dark:text-white">No content yet</h4>
          <p className="mx-auto mb-6 max-w-md text-[13px] text-slate-500 dark:text-slate-400">
            Add a block with a title, rich description, and a featured image or video.
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
        <div className="space-y-8">
          {items.map((item, index) => (
            <section
              key={item.id}
              className="group/card overflow-hidden rounded-4xl border border-slate-200/50 bg-slate-50/50 shadow-sm transition-all hover:border-slate-200/80 hover:bg-slate-50 dark:border-white/5 dark:bg-white/2"
            >
              <div className="flex items-center justify-between border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-teal-100 bg-teal-50 font-black text-teal-700 shadow-sm dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
                    {items.length - index}
                  </div>
                  <h4 className="min-w-0 truncate text-[16px] font-black text-slate-900 dark:text-white">
                    {item.title || 'New content'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 font-bold text-red-500 opacity-0 transition-all group-hover/card:opacity-100 hover:bg-red-100 hover:text-red-600 focus:opacity-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              </div>

              <div className="p-4 sm:p-8">
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
                    accept="image/*,video/*"
                    hint="Upload image/video, paste URL, or choose from Canva/Gallery below"
                    onChange={(next) => {
                      patchItem(item.id, {
                        mediaUrl: next?.url || '',
                        mediaName: next?.fileName || '',
                        mediaKind: 'upload',
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
                  <p className="mb-3 text-[11px] font-black tracking-widest text-slate-400 uppercase">Media sources</p>
                  <MediaSourceActions
                    mode="both"
                    compact
                    profileId={cardId}
                    onSelect={(asset) => applyMediaAsset(item.id, asset)}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="group flex cursor-pointer items-center gap-3">
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
                    <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400">Active</span>
                  </label>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
