import { Calendar, Download } from 'lucide-react'

export function DashboardHomeHeader() {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="w-full sm:w-1/2 lg:w-full">
        <h1 className="text-[32px] leading-tight font-black tracking-tight text-slate-900 sm:text-[40px] dark:text-white">
          Overview
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 sm:text-[15px] dark:text-slate-400">
          Track your vCard performance and engagement metrics in real-time.
        </p>
      </div>
      <div className="flex w-full items-center gap-3 sm:w-1/2 sm:justify-end lg:w-full">
        <button className="flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-300 dark:hover:bg-white/5">
          <Calendar className="h-4 w-4 text-slate-400" />
          Last 30 Days
        </button>
        <button className="flex items-center gap-2 rounded-[14px] bg-slate-900 px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>
    </div>
  )
}
