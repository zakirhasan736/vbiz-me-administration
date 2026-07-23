'use client'

import { createDefaultServiceEntry, normalizeServiceList } from '@/lib/vcardServices'
import type { VCardServiceEntry } from '@/types/vcard'
import { BellRing, Image as ImageIcon, LayoutGrid, Link as LinkIcon, Plus, Trash2, Type, Wrench } from 'lucide-react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:ring-1 shadow-sm'
const selectClasses =
  'appearance-none bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 w-full text-[13px] font-medium text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-1 transition-all shadow-sm'

type Accent = 'indigo' | 'amber'

const accentStyles: Record<
  Accent,
  {
    headerBorder: string
    headerBg: string
    iconBorder: string
    iconBg: string
    iconText: string
    titleText: string
    btnBg: string
    btnHover: string
    focusBorder: string
    focusRing: string
    badgeBorder: string
    badgeBg: string
    badgeText: string
  }
> = {
  indigo: {
    headerBorder: 'border-indigo-100 dark:border-indigo-500/10',
    headerBg: 'bg-indigo-50/50 dark:bg-indigo-500/2',
    iconBorder: 'border-indigo-100 dark:border-indigo-500/20',
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    titleText: 'text-indigo-600 dark:text-indigo-400',
    btnBg: 'bg-indigo-600 hover:bg-indigo-700',
    btnHover: 'focus:border-indigo-500 focus:ring-indigo-500',
    focusBorder: 'focus:border-indigo-500',
    focusRing: 'focus:ring-indigo-500',
    badgeBorder: 'border-indigo-100 dark:border-indigo-500/20',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    badgeText: 'text-indigo-600 dark:text-indigo-400',
  },
  amber: {
    headerBorder: 'border-amber-100 dark:border-amber-500/10',
    headerBg: 'bg-amber-50/50 dark:bg-amber-500/2',
    iconBorder: 'border-amber-100 dark:border-amber-500/20',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconText: 'text-amber-600 dark:text-amber-400',
    titleText: 'text-amber-600 dark:text-amber-400',
    btnBg: 'bg-amber-600 hover:bg-amber-700',
    btnHover: 'focus:border-amber-500 focus:ring-amber-500',
    focusBorder: 'focus:border-amber-500',
    focusRing: 'focus:ring-amber-500',
    badgeBorder: 'border-amber-100 dark:border-amber-500/20',
    badgeBg: 'bg-amber-50 dark:bg-amber-500/10',
    badgeText: 'text-amber-600 dark:text-amber-400',
  },
}

export function ServicesEditorPanel({
  services: rawServices,
  onServicesChange,
  accent = 'indigo',
}: {
  services?: VCardServiceEntry[] | null
  onServicesChange: (next: VCardServiceEntry[]) => void
  accent?: Accent
}) {
  const services = normalizeServiceList(rawServices)
  const a = accentStyles[accent]
  const inputCls = `${inputClasses} ${a.focusBorder} ${a.focusRing}`
  const selectCls = `${selectClasses} ${a.focusBorder} ${a.focusRing}`

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

  return (
    <div className="mb-12">
      <div
        className={`mb-8 rounded-[24px] border p-6 ${a.headerBorder} ${a.headerBg}`}
        data-tour-id="tour-editor-panel-services"
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-[14px] border ${a.iconBorder} ${a.iconBg}`}
            >
              <Wrench className={`h-5 w-5 ${a.iconText}`} />
            </div>
            <h3 className={`text-lg font-black ${a.titleText}`}>Service Information</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={addService}
              className={`hidden items-center justify-center gap-2 rounded-[12px] px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all active:scale-95 sm:flex ${a.btnBg}`}
            >
              <Plus className="h-4 w-4" /> Add Service
            </button>
          </div>
        </div>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Offerings shown in the Services section. Changes appear instantly in the live preview (v1 and v2 layouts).
        </p>
        <button
          type="button"
          onClick={addService}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-[12px] px-5 py-3.5 text-[13px] font-bold text-white shadow-sm transition-all active:scale-95 sm:hidden ${a.btnBg}`}
        >
          <Plus className="h-4 w-4" /> Add Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="rounded-[32px] border border-slate-200/50 bg-slate-50/50 p-12 text-center shadow-sm dark:border-white/5 dark:bg-white/2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-slate-200 bg-slate-100 dark:border-white/5 dark:bg-white/5">
            <BellRing className="h-8 w-8 text-slate-400" />
          </div>
          <h4 className="mb-2 text-[16px] font-black text-slate-900 dark:text-white">No services found</h4>
          <p className="mx-auto max-w-md text-[13px] text-slate-500 dark:text-slate-400">
            Add a service to showcase your offerings on the public profile.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {services.map((service, index) => (
            <section
              key={service.id}
              className="group/card overflow-hidden rounded-[32px] border border-slate-200/50 bg-slate-50/50 shadow-sm transition-all hover:border-slate-200/80 hover:bg-slate-50 dark:border-white/5 dark:bg-white/2"
            >
              <div className="flex items-center justify-between border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-[14px] border font-black shadow-sm ${a.badgeBorder} ${a.badgeBg} ${a.badgeText}`}
                  >
                    {services.length - index}
                  </div>
                  <h4 className="text-[16px] font-black text-slate-900 dark:text-white">
                    {service.title || 'New Service'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => removeService(service.id)}
                  className="flex items-center gap-2 rounded-[12px] bg-red-50 px-4 py-2.5 font-bold text-red-500 opacity-0 transition-all group-hover/card:opacity-100 hover:bg-red-100 hover:text-red-600 focus:opacity-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                  title="Remove Service"
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              </div>

              <div className="p-4 sm:p-8">
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="group flex flex-col space-y-1.5">
                    <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                      <LayoutGrid className={`h-3.5 w-3.5 ${a.iconText}`} /> Service Type
                    </label>
                    <select
                      value={service.type}
                      onChange={(e) => updateService(service.id, 'type', e.target.value)}
                      className={selectCls}
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
                  </div>
                  <div className="group flex flex-col space-y-1.5">
                    <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                      <Type className={`h-3.5 w-3.5 ${a.iconText}`} /> Title
                    </label>
                    <input
                      type="text"
                      value={service.title}
                      onChange={(e) => updateService(service.id, 'title', e.target.value)}
                      placeholder="Enter service title"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="group mb-8 flex flex-col space-y-1.5">
                  <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    Service Description
                  </label>
                  <textarea
                    value={service.description}
                    onChange={(e) => updateService(service.id, 'description', e.target.value)}
                    placeholder="Write your service description here..."
                    rows={5}
                    className={`min-h-[120px] w-full resize-y rounded-[16px] border border-slate-200/80 bg-white px-5 py-4 text-[13px] font-medium text-slate-900 shadow-sm dark:border-white/10 dark:bg-[#0b0f19] dark:text-white ${a.focusBorder} ${a.focusRing}`}
                  />
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="group flex flex-col space-y-1.5">
                    <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                      <LinkIcon className={`h-3.5 w-3.5 ${a.iconText}`} /> URL
                    </label>
                    <input
                      type="url"
                      value={service.url}
                      onChange={(e) => updateService(service.id, 'url', e.target.value)}
                      placeholder="https://example.com/service"
                      className={inputCls}
                    />
                  </div>
                  <div className="group flex flex-col space-y-1.5">
                    <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                      <ImageIcon className={`h-3.5 w-3.5 ${a.iconText}`} /> Featured Image URL
                    </label>
                    <input
                      type="url"
                      value={service.featuredImage}
                      onChange={(e) => updateService(service.id, 'featuredImage', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className={inputCls}
                    />
                  </div>
                </div>

                <label className="group flex cursor-pointer items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={service.active}
                      onChange={(e) => updateService(service.id, 'active', e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`relative h-[22px] w-[38px] rounded-[12px] shadow-inner transition-colors ${
                        service.active ? 'bg-green-500' : 'bg-slate-200 dark:bg-white/10'
                      }`}
                    >
                      <div
                        className={`absolute top-[3px] left-[3px] h-4 w-4 rounded-[10px] bg-white shadow transition-transform ${
                          service.active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                  <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400">Active Status</span>
                </label>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
