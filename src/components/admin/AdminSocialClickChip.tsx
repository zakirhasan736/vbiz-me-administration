import type { SocialClickStat, SocialPlatformKey } from '@/lib/adminSocialStats'
import { cn } from '@/utils/cn'
import {
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Save,
  Twitter,
  Youtube,
  type LucideIcon,
} from 'lucide-react'

const SOCIAL_ICONS: Record<SocialPlatformKey, LucideIcon> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  whatsapp: MessageCircle,
  linkedin: Linkedin,
  youtube: Youtube,
  web: Globe,
}

type SocialClickChipProps = {
  stat: SocialClickStat
  className?: string
  compact?: boolean
}

/** Brand-colored social icon + click count (matches Engagement Breakdown icons). */
export function SocialClickChip({ stat, className, compact }: SocialClickChipProps) {
  const Icon = SOCIAL_ICONS[stat.platform] || Globe

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border font-black',
        compact ? 'px-1.5 py-1 text-[9px]' : 'px-2 py-1 text-[10px]',
        stat.tone,
        className
      )}
      title={`${stat.label}: ${stat.clickCount} clicks`}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md border border-current/10 bg-white/50 dark:bg-black/20',
          compact ? 'h-5 w-5' : 'h-6 w-6'
        )}
      >
        <Icon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      </span>
      <span className="leading-none text-slate-800 tabular-nums dark:text-white">{stat.clickCount}</span>
    </span>
  )
}

type ContactSaveChipProps = {
  count: number
  className?: string
  compact?: boolean
}

/** Save-contact icon + total — sits with LinkedIn / Facebook / etc. on card lists. */
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
