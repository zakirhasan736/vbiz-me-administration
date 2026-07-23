'use client'

import { useVCard } from '@/lib/VCardContext'
import type { VCardExtraField } from '@/types/vcard'
import { ListPlus, Plus, Trash2 } from 'lucide-react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm'
const selectClasses =
  'appearance-none bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 w-full text-[13px] font-medium text-slate-900 dark:text-white outline-none cursor-pointer focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-sm'

export function Tab5ExtraFields() {
  const { vCardData, updateData } = useVCard()
  const fields =
    (vCardData.extraFields?.length ?? 0) > 0 ? vCardData.extraFields! : [{ id: '1', icon: 'Link', name: '', value: '' }]

  const setFields = (next: VCardExtraField[]) => updateData('extraFields', next)

  const addField = () => {
    setFields([...fields, { id: String(Date.now()), icon: 'Link', name: '', value: '' }])
  }

  const removeField = (id: string) => {
    const next = fields.filter((field) => field.id !== id)
    setFields(next.length > 0 ? next : [{ id: String(Date.now()), icon: 'Link', name: '', value: '' }])
  }

  const updateField = (id: string, key: 'icon' | 'name' | 'value', value: string) => {
    setFields(fields.map((field) => (field.id === id ? { ...field, [key]: value } : field)))
  }

  return (
    <div className="animate-in fade-in mx-auto w-full max-w-7xl pb-12 duration-500">
      <div className="bg-primary-50/50 dark:bg-primary-500/2 border-primary-100 dark:border-primary-500/10 mb-8 rounded-[24px] border p-6">
        <h3 className="text-primary-600 dark:text-primary-400 mb-2 text-lg font-black">Additional Custom Fields</h3>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Add any custom fields that appear in your My Info section — custom links, alternative phone numbers, or
          metadata.
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-6 overflow-hidden rounded-[32px] border border-slate-200/50 bg-slate-50/50 p-4 shadow-sm sm:p-8 dark:border-white/5 dark:bg-white/2">
          <div className="mb-2 flex items-center gap-4">
            <div className="bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 flex h-10 w-10 items-center justify-center rounded-[14px] border">
              <ListPlus className="text-primary-600 dark:text-primary-400 h-5 w-5" />
            </div>
            <h4 className="text-[16px] font-black text-slate-900 dark:text-white">Manage Fields</h4>
          </div>

          <div className="space-y-4">
            {fields.map((field) => (
              <div
                key={field.id}
                className="flex flex-col items-end gap-5 rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm transition-all md:flex-row dark:border-white/10 dark:bg-[#0b0f19]"
              >
                <div className="group w-full space-y-1.5 md:w-1/4">
                  <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                    Icon Type
                  </label>
                  <div className="relative rounded-[16px]">
                    <select
                      value={field.icon}
                      onChange={(e) => updateField(field.id, 'icon', e.target.value)}
                      className={selectClasses}
                    >
                      <option value="Link">🔗 Link</option>
                      <option value="Phone">📱 Phone</option>
                      <option value="Mail">✉️ Mail</option>
                      <option value="Location">📍 Location</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-slate-500 dark:text-slate-400">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="group w-full space-y-1.5 md:w-1/3">
                  <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                    Label
                  </label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(field.id, 'name', e.target.value)}
                    placeholder="e.g. Portfolio"
                    className={inputClasses}
                  />
                </div>
                <div className="group w-full space-y-1.5 md:flex-1">
                  <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                    Value
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateField(field.id, 'value', e.target.value)}
                      placeholder="e.g. https://..."
                      className={inputClasses}
                    />
                    <button
                      onClick={() => removeField(field.id)}
                      className="shrink-0 rounded-[16px] border border-red-500/20 bg-red-50/50 p-4 text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white active:scale-95 dark:bg-red-500/10"
                      aria-label="Remove field"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addField}
            className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-slate-900 px-6 py-4 text-[13px] font-bold text-white shadow-md transition-colors hover:bg-slate-800 active:scale-95 sm:w-auto dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <Plus className="h-4 w-4" /> Add Custom Field
          </button>
        </section>
      </div>
    </div>
  )
}
