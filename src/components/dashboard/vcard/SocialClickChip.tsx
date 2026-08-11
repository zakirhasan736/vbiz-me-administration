'use client'

import { cn } from '@/utils/cn'
import {
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Music2,
  Save,
  Share2,
  Twitter,
  Youtube,
  type LucideIcon,
} from 'lucide-react'
import type { SocialClickStat, SocialPlatformKey } from './socialStats'

const SOCIAL_ICONS: Record<SocialPlatformKey, LucideIcon> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  whatsapp: MessageCircle,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Music2,
  web: Globe,
}

type SocialClickChipProps = {
  stat: SocialClickStat
  className?: string
  compact?: boolean
  showCount?: boolean
}

export function SocialClickChip({ stat, className, compact, showCount = true }: SocialClickChipProps) {
  const Icon = SOCIAL_ICONS[stat.platform] || Globe

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border font-black',
        compact ? 'px-1.5 py-1 text-[9px]' : 'px-2 py-1 text-[10px]',
        !showCount && 'gap-0 border-0 bg-transparent p-0',
        showCount && stat.tone,
        className
      )}
      title={`${stat.label}: ${stat.clickCount} clicks`}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md border border-current/10 bg-white/50 dark:bg-black/20',
          compact || !showCount ? 'h-5 w-5' : 'h-6 w-6',
          !showCount && cn('h-7 w-7 border', stat.tone)
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      {showCount ? (
        <span className="leading-none text-slate-800 tabular-nums dark:text-white">{stat.clickCount}</span>
      ) : null}
    </span>
  )
}

type ContactSaveChipProps = {
  count: number
  className?: string
  compact?: boolean
}

export function ContactSaveChip({ count, className, compact }: ContactSaveChipProps) {
  const n = Number(count) || 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border font-black',
        'border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300',
        compact ? 'px-1.5 py-1 text-[9px]' : 'px-2 py-1 text-[10px]',
        className
      )}
      title={`Contact saves: ${n.toLocaleString()}`}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md border border-current/10 bg-white/50 dark:bg-black/20',
          compact ? 'h-5 w-5' : 'h-6 w-6'
        )}
      >
        <Save className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      </span>
      <span className="leading-none text-slate-800 tabular-nums dark:text-white">{n.toLocaleString()}</span>
    </span>
  )
}

type ShareCountChipProps = {
  count: number
  className?: string
  compact?: boolean
}

export function ShareCountChip({ count, className, compact }: ShareCountChipProps) {
  const n = Number(count) || 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border font-black',
        'border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/15 dark:text-sky-300',
        compact ? 'px-1.5 py-1 text-[9px]' : 'px-2 py-1 text-[10px]',
        className
      )}
      title={`Shares: ${n.toLocaleString()}`}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md border border-current/10 bg-white/50 dark:bg-black/20',
          compact ? 'h-5 w-5' : 'h-6 w-6'
        )}
      >
        <Share2 className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      </span>
      <span className="leading-none text-slate-800 tabular-nums dark:text-white">{n.toLocaleString()}</span>
    </span>
  )
}
