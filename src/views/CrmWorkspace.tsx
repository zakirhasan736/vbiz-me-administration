'use client'

import { Kanban } from 'lucide-react'

export default function CrmWorkspace() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <p className="text-[11px] font-bold tracking-[0.18em] text-indigo-500 uppercase">vBiz Me</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">CRM</h1>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          <Kanban className="h-5 w-5" />
        </div>
        <h2 className="mt-5 text-xl font-black text-slate-900 dark:text-white">Coming soon</h2>
        <p className="mt-2 max-w-xl text-sm font-medium text-slate-600 dark:text-slate-300">
          Native vBiz Me CRM is reserved here. Leads, pipeline, tasks, and calendar will open in this same area when
          they are ready. There is no separate CRM login.
        </p>
      </div>
    </div>
  )
}
