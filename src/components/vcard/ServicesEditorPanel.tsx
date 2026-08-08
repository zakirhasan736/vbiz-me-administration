'use client'

import { AiDropFillZone, type ParsedEntry } from '@/components/AiDropFillZone'
import { MediaFileUploader } from '@/components/media/MediaFileUploader'
import { ReorderList } from '@/components/ReorderList'
import { SectionJumpPills } from '@/components/SectionJumpPills'
import { createDefaultServiceEntry, normalizeServiceList } from '@/lib/vcardServices'
import type { VCardServiceEntry } from '@/types/vcard'
import { BellRing, LayoutGrid, Link as LinkIcon, Plus, Trash2, Type, Wrench } from 'lucide-react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm'
const selectClasses =
  'appearance-none bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 w-full text-[13px] font-medium text-slate-900 dark:text-white outline-none cursor-pointer focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm'

export function ServicesEditorPanel({
  services: rawServices,
  onServicesChange,
  profileId,
}: {
  services?: VCardServiceEntry[] | null
  onServicesChange: (next: VCardServiceEntry[]) => void
  profileId?: string | null
}) {
  const services = normalizeServiceList(rawServices)

  const addService = () => {
    onServicesChange([createDefaultServiceEntry(), ...services])
  }

  const removeService = (id: string) => {
    onServicesChange(services.filter((s) => s.id !== id))
  }

  const updateService = (
    id: string,
    field: keyof VCardServiceEntry,
    value: VCardServiceEntry[keyof VCardServiceEntry]
  ) => {
    onServicesChange(services.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const applyParsed = (entries: ParsedEntry[]) => {
    const mapped = entries.map((e) => ({
      ...createDefaultServiceEntry(),
      title: e.title,
      description: e.description,
      type: 'Other',
    }))
    onServicesChange([...mapped, ...services])
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
            <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400">Services Collection</h3>
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
        hint="Drop or paste service list — each block becomes a service (title + description)"
        onParsed={applyParsed}
      />

      <SectionJumpPills
        accent="indigo"
        label="Jump to service"
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
        </div>
      ) : (
        <ReorderList
          items={services}
          getKey={(s) => s.id}
          onReorder={onServicesChange}
          className="space-y-8"
          renderItem={(service, index, controls) => (
            <section
              id={`entry-${service.id}`}
              className="group/card scroll-mt-24 overflow-hidden rounded-4xl border border-slate-200/50 bg-slate-50/50 shadow-sm transition-all hover:border-slate-200/80 hover:bg-slate-50 dark:border-white/5 dark:bg-white/2"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-200/50 px-8 py-6 dark:border-white/5">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-indigo-100 bg-indigo-50 font-black text-indigo-600 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
                    {index + 1}
                  </div>
                  <h4 className="truncate text-[16px] font-black text-slate-900 dark:text-white">
                    {service.title || 'New Service'}
                  </h4>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {controls}
                  <button
                    type="button"
                    onClick={() => removeService(service.id)}
                    className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 font-bold text-red-500 hover:bg-red-100 hover:text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                    title="Remove Service"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
              </div>

              <div className="p-8">
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

                <div className="mb-8">
                  <MediaFileUploader
                    label="Featured Image"
                    accent="primary"
                    profileId={profileId}
                    attachmentType="Service Featured"
                    accept="image/*"
                    allowUrlPaste={false}
                    hint="Max file size: 2MB"
                    value={service.featuredImage}
                    onChange={(next) => updateService(service.id, 'featuredImage', next?.url || '')}
                  />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="group flex cursor-pointer items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={service.active}
                        onChange={(e) => updateService(service.id, 'active', e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="relative h-5.5 w-9.5 rounded-xl bg-slate-200 shadow-inner transition-colors peer-checked:bg-green-500 dark:bg-white/10">
                        <div className="absolute top-0.75 left-0.75 h-4 w-4 rounded-[10px] bg-white shadow transition-transform peer-checked:translate-x-4" />
                      </div>
                    </div>
                    <span className="text-[13px] font-bold text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400">
                      Active Status
                    </span>
                  </label>
                </div>
              </div>
            </section>
          )}
        />
      )}
    </div>
  )
}
