import { tableData } from '@/constants/dashboardHome'
import { Activity, TrendingUp } from 'lucide-react'

export function RecentEngagementTable() {
  return (
    <div className="mb-10 overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] dark:border-white/5 dark:bg-[#0b0f19]">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-6 py-8 sm:flex-row sm:items-center md:px-8 dark:border-white/5">
        <h2 className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-slate-200/50 bg-slate-50 shadow-sm dark:border-white/5 dark:bg-slate-800/50">
            <Activity className="h-5 w-5 text-slate-500" />
          </span>
          Recent Engagement
        </h2>
        <button className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 rounded-xl px-4 py-2 text-[13px] font-bold transition-colors">
          View All Activity
        </button>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-slate-500 dark:bg-white/2 dark:text-slate-400">
            <tr>
              <th className="px-8 py-4 text-[11px] font-bold tracking-widest whitespace-nowrap uppercase">Event</th>
              <th className="px-8 py-4 text-[11px] font-bold tracking-widest whitespace-nowrap uppercase">Viewer</th>
              <th className="px-8 py-4 text-[11px] font-bold tracking-widest whitespace-nowrap uppercase">Time</th>
              <th className="px-8 py-4 text-right text-[11px] font-bold tracking-widest whitespace-nowrap uppercase">
                Platform
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {tableData.map((row) => (
              <tr
                key={row.id}
                className="group cursor-default transition-colors hover:bg-slate-50/80 dark:hover:bg-[#121827]"
              >
                <td className="flex items-center gap-4 px-8 py-5 font-bold text-slate-900 dark:text-slate-200">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-sky-50 text-sky-600 transition-transform group-hover:scale-110 dark:bg-sky-500/10 dark:text-sky-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  {row.event}
                </td>
                <td className="px-8 py-5 font-semibold text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    {row.viewer !== 'Guest' ? (
                      <div className="bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold">
                        {row.viewer.charAt(0)}
                      </div>
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-slate-800">
                        G
                      </div>
                    )}
                    {row.viewer}
                  </div>
                </td>
                <td className="px-8 py-5 text-[13px] font-medium text-slate-500 dark:text-slate-400">{row.time}</td>
                <td className="px-8 py-5 text-right font-medium">
                  <span className="group-hover:border-primary-500/30 group-hover:text-primary-600 dark:group-hover:text-primary-400 inline-flex items-center rounded-[10px] border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-600 uppercase shadow-sm transition-colors dark:border-white/10 dark:bg-slate-800 dark:text-slate-300">
                    {row.platform}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
