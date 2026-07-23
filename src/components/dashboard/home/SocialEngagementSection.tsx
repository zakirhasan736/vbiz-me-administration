import { socialStatCards } from '@/constants/dashboardHome'
import { cn } from '@/utils/cn'
import { Activity } from 'lucide-react'

export function SocialEngagementSection() {
  return (
    <div className="animate-in slide-in-from-bottom-4 fill-mode-both mb-10 delay-100">
      <h3 className="mb-5 flex items-center gap-2 px-1 text-[15px] font-bold text-slate-900 dark:text-white">
        <Activity className="h-4 w-4 text-slate-400" />
        Social Engagement Channels
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {socialStatCards.map((stat, i) => (
          <div
            key={i}
            className="group rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.05)] dark:border-white/5 dark:bg-[#0b0f19] dark:hover:border-white/10 dark:hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.4)]"
          >
            <div
              className={cn(
                'mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] border border-black/5 shadow-sm transition-transform group-hover:scale-110 dark:border-white/5',
                stat.bg,
                stat.color
              )}
            >
              <stat.icon className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <p className="mb-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{stat.topText}</p>
              <p className="text-[11px] leading-tight font-bold tracking-widest text-slate-500 uppercase">
                {stat.bottomText.replace(' Clicks', '')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
