'use client'

import { ModalPortal } from '@/components/ModalPortal'
import { AdminTemplatesSkeleton } from '@/components/admin/AdminTemplatesSkeleton'
import {
  useGetAdminTemplatesQuery,
  useUpdateAdminTemplateMutation,
} from '@/redux/features/adminTemplates/adminTemplates.api'
import type { CardTemplate, CardTemplateId, CardTemplateStatus } from '@/types/template'
import { cn } from '@/utils/cn'
import { CheckCircle2, Edit2, LayoutTemplate, Loader2, X, XCircle } from 'lucide-react'
import { useState } from 'react'

const PREVIEW_BY_ID: Record<CardTemplateId, string> = {
  v3: 'bg-gradient-to-br from-sky-500 to-cyan-700',
  v2: 'bg-gradient-to-br from-slate-800 to-indigo-900',
  v1: 'bg-gradient-to-br from-amber-100 to-slate-300',
}

type EditDraft = {
  id: CardTemplateId
  name: string
  description: string
  status: CardTemplateStatus
}

export default function AdminTemplates() {
  const { data: templates = [], isLoading, isError, isFetching } = useGetAdminTemplatesQuery()
  const [updateTemplate, { isLoading: isSaving }] = useUpdateAdminTemplateMutation()
  const [editing, setEditing] = useState<EditDraft | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const openEdit = (template: CardTemplate) => {
    setSaveError(null)
    setEditing({
      id: template.id,
      name: template.name,
      description: template.description,
      status: template.status,
    })
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    const name = editing.name.trim()
    const description = editing.description.trim()
    if (!name || !description) {
      setSaveError('Name and description are required.')
      return
    }
    try {
      await updateTemplate({
        id: editing.id,
        body: {
          name,
          description,
          status: editing.status,
        },
      }).unwrap()
      setEditing(null)
      setSaveError(null)
    } catch {
      setSaveError('Could not save template. Try again.')
    }
  }

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-6 p-6 duration-500 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-800 dark:text-white">
            <LayoutTemplate className="h-7 w-7 text-indigo-600" />
            Template Management
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage vCard design templates used in template selection. Edits update what users see.
          </p>
        </div>
        {isFetching && !isLoading ? (
          <span className="flex items-center gap-1.5 self-start text-xs font-bold text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Refreshing
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <AdminTemplatesSkeleton />
      ) : isError ? (
        <div className="rounded-3xl border border-dashed border-rose-300 py-16 text-center dark:border-rose-500/30">
          <p className="font-bold text-rose-600 dark:text-rose-300">Could not load templates</p>
          <p className="mt-2 text-sm text-slate-500">Check that the API is running and try again.</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center dark:border-white/10">
          <p className="font-bold text-slate-700 dark:text-slate-200">No templates found</p>
          <p className="mt-2 text-sm text-slate-500">Seed data may not have run yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-white/10 dark:bg-[#0b0f19]"
            >
              <div
                className={cn(
                  'relative flex h-40 items-center justify-center p-4',
                  PREVIEW_BY_ID[template.id] ?? 'bg-slate-700'
                )}
              >
                <div className="flex h-full w-full flex-col gap-2 rounded-xl border border-white/20 bg-white/20 p-3 shadow-sm backdrop-blur-md">
                  {template.id === 'v2' ? (
                    <>
                      <div className="h-6 w-full rounded bg-white/40" />
                      <div className="mx-auto h-8 w-8 rounded-full bg-white/50" />
                      <div className="mt-auto grid grid-cols-3 gap-1">
                        <div className="h-3 rounded bg-white/30" />
                        <div className="h-3 rounded bg-white/30" />
                        <div className="h-3 rounded bg-white/30" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-10 w-10 rounded-full bg-white/40" />
                      <div className="h-3 w-24 rounded-full bg-white/40" />
                      <div className="h-2 w-16 rounded-full bg-white/30" />
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-lg leading-tight font-bold text-slate-900 dark:text-white">{template.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">{template.description}</p>
                  </div>
                  <div
                    className={cn(
                      'flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold tracking-wider uppercase',
                      template.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {template.status === 'active' ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {template.status}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-sm font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-white">{template.uses}</span> active profiles
                  using this
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => openEdit(template)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-50 py-2 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-100"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ModalPortal>
          <div className="fixed inset-0 z-200 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 dark:text-white">Edit Template</h4>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Shell ID: {editing.id}</p>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder="Template name"
                disabled={isSaving}
              />
              <textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder="Description shown in vCard settings"
                disabled={isSaving}
              />
              <select
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as CardTemplateStatus })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                disabled={isSaving}
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
              {saveError ? <p className="text-sm font-semibold text-rose-600">{saveError}</p> : null}
              <button
                type="button"
                onClick={() => void handleSaveEdit()}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Template
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
