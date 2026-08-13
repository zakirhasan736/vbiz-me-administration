'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { StatNumber } from '@/components/ui/StatNumber'
import type { DashboardSocialChannel } from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import {
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
  trendPercent?: number
}

type CorporateSocialBreakdownProps = {
  channels?: SocialChannelStat[]
  loading?: boolean
  onOpenSocialsTab?: () => void
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

export function CorporateSocialBreakdown({
  channels,
  loading = false,
  onOpenSocialsTab,
}: CorporateSocialBreakdownProps) {
  const rows = channels ?? []

  return (
    <div className="animate-in fade-in space-y-5 duration-500">
      <div className="flex flex-col justify-between gap-4 px-1 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-2xl border border-amber-100 bg-amber-50 p-2.5 text-amber-500 dark:border-amber-500/20 dark:bg-amber-500/10">
            <Globe className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
              Social Engagement Breakdown
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Social platform clicks and views tracking metrics across all users
            </p>
          </div>
        </div>
        {onOpenSocialsTab ? (
          <button
            type="button"
            onClick={onOpenSocialsTab}
            className="self-start rounded-full border border-amber-500/40 bg-white px-5 py-2.5 text-[10px] font-black tracking-wider text-amber-600 uppercase shadow-sm transition-all hover:border-amber-500 hover:bg-amber-50/20 active:scale-95 sm:self-center dark:text-amber-400"
          >
            Social Clicks Analytics
          </button>
        ) : null}
      </div>

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
          <Globe className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-white/15" />
          <p className="text-xs font-semibold text-slate-400">No social click data yet.</p>
        </div>
      )}
    </div>
  )
}
