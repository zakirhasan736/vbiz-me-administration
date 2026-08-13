import { Skeleton } from '@/components/ui/Skeleton'
import { StatNumber } from '@/components/ui/StatNumber'
import type { DashboardSocialChannel } from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import {
  Activity,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Music2,
  Pin,
  Radio,
  Twitter,
  Youtube,
  type LucideIcon,
} from 'lucide-react'

type SocialChannelStat = {
  channel: DashboardSocialChannel
  label: string
  count: number
  trendPercent: number
}

type SocialEngagementSectionProps = {
  channels?: SocialChannelStat[]
  loading?: boolean
}

const CHANNEL_UI: Record<DashboardSocialChannel, { icon: LucideIcon; color: string; bg: string }> = {
  facebook: { icon: Facebook, color: 'text-[#1877F2]', bg: 'bg-[#1877F2]/10' },
  twitter: { icon: Twitter, color: 'text-[#1DA1F2]', bg: 'bg-[#1DA1F2]/10' },
  instagram: { icon: Instagram, color: 'text-[#E4405F]', bg: 'bg-[#E4405F]/10' },
  whatsapp: { icon: MessageCircle, color: 'text-[#25D366]', bg: 'bg-[#25D366]/10' },
  linkedin: { icon: Linkedin, color: 'text-[#0A66C2]', bg: 'bg-[#0A66C2]/10' },
  youtube: { icon: Youtube, color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/10' },
  tiktok: { icon: Music2, color: 'text-slate-900 dark:text-white', bg: 'bg-slate-900/10 dark:bg-white/10' },
  truth: { icon: Radio, color: 'text-[#5415D0]', bg: 'bg-[#5415D0]/10' },
  rumble: { icon: Radio, color: 'text-[#85C742]', bg: 'bg-[#85C742]/10' },
  pinterest: { icon: Pin, color: 'text-[#E60023]', bg: 'bg-[#E60023]/10' },
  website: { icon: Globe, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-500/10' },
}

function SocialChannelSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#0b0f19]">
      <Skeleton className="mb-5 h-12 w-12 rounded-[14px]" />
      <Skeleton className="mb-2 h-8 w-16 rounded-lg" />
      <Skeleton variant="text" className="h-3 w-20" />
    </div>
  )
}

export function SocialEngagementSection({ channels, loading = false }: SocialEngagementSectionProps) {
  const rows = channels ?? []

  return (
    <div className="animate-in slide-in-from-bottom-4 fill-mode-both mb-10 delay-100">
      <h3 className="mb-5 flex items-center gap-2 px-1 text-[15px] font-bold text-slate-900 dark:text-white">
        <Activity className="h-4 w-4 text-slate-400" />
        Social Engagement Channels
      </h3>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SocialChannelSkeleton key={index} />
          ))}
        </div>
      ) : rows.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {rows.map((stat) => {
            const ui = CHANNEL_UI[stat.channel] ?? CHANNEL_UI.website
            const Icon = ui.icon
            return (
              <div
                key={stat.channel}
                className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.05)] dark:border-white/5 dark:bg-[#0b0f19] dark:hover:border-white/10 dark:hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.4)]"
              >
                <div
                  className={cn(
                    'mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] border border-black/5 shadow-sm transition-transform group-hover:scale-110 dark:border-white/5',
                    ui.bg,
                    ui.color
                  )}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="mb-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    <StatNumber
                      value={stat.count}
                      className="text-3xl font-black tracking-tight text-slate-900 dark:text-white"
                      skeletonClassName="h-8 w-16 rounded-lg"
                    />
                  </p>
                  <p className="text-[11px] leading-tight font-bold tracking-widest text-slate-500 uppercase">
                    {stat.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-10 text-center dark:border-white/10 dark:bg-[#0b0f19]">
          <Activity className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-white/15" />
          <p className="text-xs font-semibold text-slate-400">No social click data yet.</p>
        </div>
      )}
    </div>
  )
}
