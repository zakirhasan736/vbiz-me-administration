'use client'

import { AiDropFillZone, type AiFilledResult } from '@/components/AiDropFillZone'
import { MediaFileUploader } from '@/components/media/MediaFileUploader'
import { MediaSourceActions } from '@/components/MediaSourceActions'
import { ReorderList } from '@/components/ReorderList'
import { SectionJumpPills } from '@/components/SectionJumpPills'
import {
  ExpandableEntryBody,
  ExpandableEntryHeader,
  bottomAddButtonClass,
  expandableCardClassName,
} from '@/components/vcard/ExpandableEntryChrome'
import { useExpandableEntryList } from '@/hooks/useExpandableEntryList'
import { mapServicesFromPayload } from '@/lib/ai/applyCardDraft'
import { createDefaultServiceEntry, normalizeServiceList } from '@/lib/vcardServices'
import { useResolvedSectionTitle } from '@/profile-app/lib/sectionTitleContext'
import type { VCardServiceEntry } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { BellRing, LayoutGrid, Link as LinkIcon, Plus, Type, Wrench } from 'lucide-react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm'
const selectClasses =
  'appearance-none bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 w-full text-[13px] font-medium text-slate-900 dark:text-white outline-none cursor-pointer focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm'

const accent = {
  border: 'border-indigo-100 dark:border-indigo-500/20',
  bg: 'bg-indigo-50 dark:bg-indigo-500/10',
  text: 'text-indigo-600 dark:text-indigo-400',
  chevronOpen: 'text-indigo-500',
  cardExpandedBorder: 'border-indigo-200/60 dark:border-indigo-500/20',
}

export function ServicesEditorPanel({
  services: rawServices,
  onServicesChange,
  profileId,
}: {
  services?: VCardServiceEntry[] | null
  onServicesChange: (next: VCardServiceEntry[]) => void
  profileId?: string | null
}) {
  const sectionTitle = useResolvedSectionTitle(undefined, 'Services')
  const services = normalizeServiceList(rawServices)
  const { isExpanded, toggleExpanded, expandNew, recoverExpandedAfterRemove, setCardRef, setExpandedId } =
    useExpandableEntryList(services)

  const addService = () => {
    const next = createDefaultServiceEntry()
    onServicesChange([...services, next])
    expandNew(next.id)
  }

  const removeService = (id: string) => {
    const next = services.filter((s) => s.id !== id)
    onServicesChange(next)
    recoverExpandedAfterRemove(id, next)
  }

  const updateService = (
    id: string,
    field: keyof VCardServiceEntry,
    value: VCardServiceEntry[keyof VCardServiceEntry]
  ) => {
    onServicesChange(services.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const applyFilled = (result: AiFilledResult) => {
    const mapped = mapServicesFromPayload(result.payload)
    if (!mapped.length) return
    onServicesChange([...mapped, ...services])
    expandNew(mapped[0]!.id)
  }

  return (
    <div className="mb-12">
      <div
        className="mb-8 rounded-3xl border border-indigo-100 bg-indigo-50/50 p-6 dark:border-indigo-500/10 dark:bg-indigo-500/2"
        data-tour-id="tour-editor-panel-services"
      >
        <div className="mb-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-indigo-100 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10">
              <Wrench className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400">{sectionTitle} Collection</h3>
          </div>
          <button
            type="button"
            onClick={addService}
            className="hidden items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 sm:flex"
          >
            <Plus className="h-4 w-4" /> Add Service
          </button>
        </div>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Offerings you provide to clients. Title and description are required for completion.
        </p>
        <button
          type="button"
          onClick={addService}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 sm:hidden"
        >
          <Plus className="h-4 w-4" /> Add Service
        </button>
      </div>

      <AiDropFillZone
        section="services"
        profileId={profileId}
        currentDraft={{ services }}
        hint="Drop or paste a service list — AI fills type, title, and description (OCR for images)"
        onFilled={applyFilled}
      />

      <SectionJumpPills
        accent="indigo"
        label="Quick find"
        onJump={setExpandedId}
        items={services.map((s) => ({
          id: s.id,
          title: s.title || 'Untitled',
          detail: s.type || s.description?.slice(0, 36),
        }))}
      />

      {services.length === 0 ? (
        <div className="rounded-4xl border border-slate-200/50 bg-slate-50/50 p-12 text-center shadow-sm dark:border-white/5 dark:bg-white/2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-slate-200 bg-slate-100 dark:border-white/5 dark:bg-white/5">
            <BellRing className="h-8 w-8 text-slate-400" />
          </div>
          <h4 className="mb-2 text-[16px] font-black text-slate-900 dark:text-white">No services found</h4>
          <p className="mx-auto mb-6 max-w-md text-[13px] text-slate-500 dark:text-slate-400">
            Click the &quot;Add Service&quot; button to get started and showcase your offerings.
          </p>
          <button
            type="button"
            onClick={addService}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Service
          </button>
        </div>
      ) : (
        <>
          <ReorderList
            items={services}
            getKey={(s) => s.id}
            onReorder={onServicesChange}
            className="space-y-4"
            renderItem={(service, index) => {
              const open = isExpanded(service.id)
              return (
                <section
                  id={`entry-${service.id}`}
                  ref={(el) => setCardRef(service.id, el)}
                  className={cn(expandableCardClassName(open, accent), 'scroll-mt-24')}
                >
                  <ExpandableEntryHeader
                    indexLabel={index + 1}
                    title={service.title || 'New Service'}
                    subtitle={service.type || service.description?.slice(0, 48) || null}
                    isExpanded={open}
                    onToggle={() => toggleExpanded(service.id)}
                    showRemove
                    onRemove={() => removeService(service.id)}
                    accent={accent}
                  />

                  <ExpandableEntryBody isExpanded={open} className="p-8">
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="group flex flex-col space-y-1.5">
                        <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                          <LayoutGrid className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> Service Type
                        </label>
                        <div className="relative">
                          <select
                            value={service.type}
                            onChange={(e) => updateService(service.id, 'type', e.target.value)}
                            className={selectClasses}
                          >
                            <option value="" disabled>
                              Select Type
                            </option>
                            <option value="Web Development">Web Development</option>
                            <option value="App Design">App Design</option>
                            <option value="SEO">SEO</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Other">Other</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-slate-500 dark:text-slate-400">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="group flex flex-col space-y-1.5">
                        <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                          <Type className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> Title
                        </label>
                        <input
                          type="text"
                          value={service.title}
                          onChange={(e) => updateService(service.id, 'title', e.target.value)}
                          placeholder="Enter service title"
                          className={inputClasses}
                        />
                      </div>
                    </div>

                    <div className="group mb-8 flex flex-col space-y-1.5">
                      <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                        Service Description
                      </label>
                      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-white/10 dark:bg-[#0b0f19]">
                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/50 bg-slate-50/50 px-4 py-3 dark:border-white/5 dark:bg-white/2">
                          <span className="mr-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                            Format
                          </span>
                          <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10"
                          >
                            <strong className="text-[13px] leading-none font-black">B</strong>
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10"
                          >
                            <em className="font-serif text-[13px] leading-none italic">I</em>
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10"
                          >
                            <u className="text-[13px] leading-none font-medium underline">U</u>
                          </button>
                          <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-white/10" />
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10"
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <textarea
                          value={service.description}
                          onChange={(e) => updateService(service.id, 'description', e.target.value)}
                          placeholder="Write your service description here..."
                          rows={5}
                          className="min-h-30 w-full resize-y bg-transparent px-5 py-4 text-[13px] font-medium text-slate-900 focus:outline-none dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="group mb-8 flex flex-col space-y-1.5">
                      <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                        <LinkIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> URL
                      </label>
                      <input
                        type="text"
                        value={service.url}
                        onChange={(e) => updateService(service.id, 'url', e.target.value)}
                        placeholder="Enter URL"
                        className={inputClasses}
                      />
                    </div>

                    <div className="mb-8 space-y-1.5">
                      <MediaFileUploader
                        label="Featured Image"
                        accent="primary"
                        profileId={profileId}
                        attachmentType="Service Featured"
                        accept="image/*"
                        allowUrlPaste={false}
                        hint="Image or video • no size limit"
                        value={service.featuredImage}
                        onChange={(next) => updateService(service.id, 'featuredImage', next?.url || '')}
                      />
                      <MediaSourceActions
                        mode="image"
                        compact
                        onSelect={(asset) => updateService(service.id, 'featuredImage', asset.url)}
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <label className="group flex cursor-pointer items-center gap-3">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            role="switch"
                            aria-checked={service.active}
                            checked={service.active}
                            onChange={(e) => updateService(service.id, 'active', e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`relative h-5.5 w-9.5 rounded-xl shadow-inner transition-colors ${
                              service.active ? 'bg-green-500' : 'bg-slate-200 dark:bg-white/10'
                            }`}
                          >
                            <div
                              className={`absolute top-0.75 left-0.75 h-4 w-4 rounded-[10px] bg-white shadow transition-transform ${
                                service.active ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </div>
                        </div>
                        <span className="text-[13px] font-bold text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400">
                          Active Status
                        </span>
                      </label>
                    </div>
                  </ExpandableEntryBody>
                </section>
              )
            }}
          />

          <div className="mt-8 flex flex-col items-center gap-4 pt-6">
            <button
              type="button"
              onClick={addService}
              className={cn(bottomAddButtonClass, 'text-indigo-600 hover:border-indigo-500/30 dark:text-indigo-400')}
            >
              <Plus className="h-4 w-4" /> Add Another Service
            </button>
          </div>
        </>
      )}
    </div>
  )
}
