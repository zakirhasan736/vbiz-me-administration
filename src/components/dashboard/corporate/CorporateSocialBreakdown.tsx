'use client'

import type { DashboardSocialChannel } from '@/redux/features/profiles/profiles.api'
import { cn } from '@/utils/cn'
import { Facebook, Globe, Instagram, Linkedin, MessageCircle, Twitter, Youtube, type LucideIcon } from 'lucide-react'

const PLATFORM_UI: Array<{
  key: string
  title: string
  channel?: DashboardSocialChannel
  icon: LucideIcon
  bg: string
}> = [
  {
    key: 'Facebook',
    title: 'FACEBOOK',
    channel: 'facebook',
    icon: Facebook,
    bg: 'bg-blue-50/70 text-[#1877F2] border-blue-100/50 dark:bg-blue-500/10 dark:border-blue-500/20',
  },
  {
    key: 'Twitter',
    title: 'TWITTER',
    channel: 'twitter',
    icon: Twitter,
    bg: 'bg-slate-50/70 text-slate-650 border-slate-100/50 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
  },
  {
    key: 'Instagram',
    title: 'INSTAGRAM',
    channel: 'instagram',
    icon: Instagram,
    bg: 'bg-pink-50/70 text-pink-500 border-pink-100/50 dark:bg-pink-500/10 dark:border-pink-500/20',
  },
  {
    key: 'WhatsApp',
    title: 'WHATSAPP',
    channel: 'whatsapp',
    icon: MessageCircle,
    bg: 'bg-emerald-50/70 text-emerald-500 border-emerald-100/50 dark:bg-emerald-500/10 dark:border-emerald-500/20',
  },
  {
    key: 'LinkedIn',
    title: 'LINKEDIN',
    channel: 'linkedin',
    icon: Linkedin,
    bg: 'bg-blue-50/70 text-[#0A66C2] border-blue-100/50 dark:bg-[#0A66C2]/10 dark:border-[#0A66C2]/20',
  },
  {
    key: 'YouTube',
    title: 'YOUTUBE',
    channel: 'youtube',
    icon: Youtube,
    bg: 'bg-red-50/70 text-red-500 border-red-100/50 dark:bg-red-500/10 dark:border-red-500/20',
  },
  {
    key: 'Web Visits',
    title: 'WEB VISITS',
    channel: 'website',
    icon: Globe,
    bg: 'bg-purple-50/70 text-purple-600 border-purple-100/50 dark:bg-purple-500/10 dark:border-purple-500/20',
  },
]

type SocialChannelStat = {
  channel: DashboardSocialChannel
  label: string
  count: number
}

type CorporateSocialBreakdownProps = {
  channels?: SocialChannelStat[]
  onOpenSocialsTab?: () => void
}

export function CorporateSocialBreakdown({ channels = [], onOpenSocialsTab }: CorporateSocialBreakdownProps) {
  const counts = new Map<string, number>()
  for (const ch of channels) {
    const label =
      ch.channel === 'website' ? 'Web Visits' : ch.label || ch.channel.charAt(0).toUpperCase() + ch.channel.slice(1)
    counts.set(label, (counts.get(label) || 0) + (ch.count || 0))
  }

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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {PLATFORM_UI.map((card) => {
          const IconComp = card.icon
          const value = counts.get(card.key) ?? 0
          return (
            <div
              key={card.key}
              className="border-slate-150/80 flex flex-col items-center justify-center rounded-3xl border bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-white/5 dark:bg-[#0b0f19]"
            >
              <div
                className={cn(
                  'mb-4 flex h-14 w-14 items-center justify-center rounded-[22px] border shadow-sm',
                  card.bg
                )}
              >
                <IconComp className="h-6 w-6" />
              </div>
              <span className="text-xl leading-tight font-black text-slate-900 md:text-2xl dark:text-white">
                {value.toLocaleString()}
              </span>
              <span className="mt-2.5 max-w-full truncate text-[10px] font-black tracking-wider text-slate-400/85 uppercase">
                {card.title}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
