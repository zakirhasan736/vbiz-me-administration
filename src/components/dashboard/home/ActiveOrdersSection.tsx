'use client'

import { formatDeliveryCountdown, type TimeLeft } from '@/utils/orderTimer'
import { Activity, Clock, MessageCircle } from 'lucide-react'

type ActiveOrdersSectionProps = {
  timeLeft: TimeLeft
  onContactSupport: () => void
}

export function ActiveOrdersSection({ timeLeft, onContactSupport }: ActiveOrdersSectionProps) {
  return (
    <div className="animate-in slide-in-from-bottom-4 mb-10">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="flex items-center gap-2 px-1 text-[15px] font-bold text-slate-900 dark:text-white">
          <Activity className="h-4 w-4 text-slate-400" />
          Active Orders
        </h2>
        <span className="bg-primary-500 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm">
          1
        </span>
      </div>
      <div className="group relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.05)] sm:p-8 dark:border-white/5 dark:bg-[#0b0f19]">
        <div className="bg-primary-500/5 dark:bg-primary-500/10 absolute top-0 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/2 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:gap-8 lg:flex-row lg:items-center">
          <div className="flex items-center gap-5">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-slate-200 bg-slate-50 shadow-sm transition-transform duration-500 group-hover:scale-105 dark:border-white/10 dark:bg-slate-800">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=200&h=200')] bg-cover bg-center transition-transform duration-700 group-hover:scale-110"></div>
            </div>
            <div>
              <div className="mb-1.5 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Custom Intro Video</h3>
                <span className="bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase">
                  <div className="bg-primary-500 h-1.5 w-1.5 animate-pulse rounded-full"></div>
                  In Progress
                </span>
              </div>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                Order #INV-2094 • Placed recently
              </p>
            </div>
          </div>

          <div className="w-full flex-1 rounded-[20px] border border-slate-200 bg-slate-50 p-5 transition-colors group-hover:border-slate-300 lg:max-w-md dark:border-white/5 dark:bg-slate-900/50 dark:group-hover:border-white/10">
            <div className="mobile:flex-row mobile:items-center mobile:gap-0 mb-4 flex flex-col items-start justify-between gap-1">
              <span className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] font-bold">
                <Clock className="h-4 w-4" /> Est. Delivery: {formatDeliveryCountdown(timeLeft)}
              </span>
              <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                In Queue
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="bg-primary-500 absolute top-0 left-0 h-full w-[1%] rounded-full shadow-[0_0_10px_2px_rgba(99,102,241,0.5)]"></div>
            </div>
          </div>

          <button
            onClick={onContactSupport}
            className="flex shrink-0 items-center justify-center gap-2 rounded-[16px] border border-slate-200 bg-white px-5 py-3.5 text-[14px] font-bold text-slate-900 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] transition-all hover:bg-slate-50 active:scale-95 dark:border-white/10 dark:bg-[#1e2333] dark:text-white dark:hover:bg-[#252b3d]"
          >
            <MessageCircle className="text-primary-500 h-4 w-4 shrink-0" /> Support
          </button>
        </div>
      </div>
    </div>
  )
}
