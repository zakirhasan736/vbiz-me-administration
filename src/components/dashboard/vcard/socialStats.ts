import type { LiveSocialClickRow } from '@/redux/features/profiles/profiles.api'
import type { VCardRecord } from '@/types/vcard'

export type SocialPlatformKey =
  'facebook' | 'twitter' | 'instagram' | 'whatsapp' | 'linkedin' | 'youtube' | 'tiktok' | 'web'

export type SocialClickStat = {
  key: string
  platform: SocialPlatformKey
  label: string
  clickCount: number
  tone: string
}

export function resolveSocialPlatform(platform: string): SocialPlatformKey {
  const p = platform.toLowerCase()
  if (p.includes('facebook')) return 'facebook'
  if (p.includes('twitter') || p === 'x' || p.includes('x.com')) return 'twitter'
  if (p.includes('instagram')) return 'instagram'
  if (p.includes('whatsapp')) return 'whatsapp'
  if (p.includes('linkedin')) return 'linkedin'
  if (p.includes('youtube')) return 'youtube'
  if (p.includes('tiktok')) return 'tiktok'
  return 'web'
}

function displayName(platform: SocialPlatformKey): string {
  switch (platform) {
    case 'facebook':
      return 'Facebook'
    case 'twitter':
      return 'Twitter'
    case 'instagram':
      return 'Instagram'
    case 'whatsapp':
      return 'WhatsApp'
    case 'linkedin':
      return 'LinkedIn'
    case 'youtube':
      return 'YouTube'
    case 'tiktok':
      return 'TikTok'
    default:
      return 'Web'
  }
}

function toneFor(platform: SocialPlatformKey): string {
  switch (platform) {
    case 'facebook':
      return 'bg-blue-50/70 dark:bg-blue-500/10 text-[#1877F2] border-blue-100/50 dark:border-blue-500/20'
    case 'twitter':
      return 'bg-slate-50/70 dark:bg-slate-500/10 text-sky-500 dark:text-slate-300 border-slate-100/50 dark:border-slate-500/20'
    case 'instagram':
      return 'bg-pink-50/70 dark:bg-pink-500/10 text-pink-500 border-pink-100/50 dark:border-pink-500/20'
    case 'whatsapp':
      return 'bg-emerald-50/70 dark:bg-emerald-500/10 text-emerald-500 border-emerald-200/50 dark:border-emerald-500/20'
    case 'linkedin':
      return 'bg-blue-50/70 dark:bg-[#0A66C2]/10 text-[#0A66C2] border-blue-100/50 dark:border-[#0A66C2]/20'
    case 'youtube':
      return 'bg-red-50/70 dark:bg-red-500/10 text-red-500 border-red-100/50 dark:border-red-500/20'
    case 'tiktok':
      return 'bg-slate-50/70 dark:bg-slate-500/10 text-slate-800 dark:text-slate-200 border-slate-200/50 dark:border-slate-500/20'
    default:
      return 'bg-purple-50/70 dark:bg-purple-500/10 text-purple-600 border-purple-100/50 dark:border-purple-500/20'
  }
}

function clickCountFor(platform: SocialPlatformKey, platformKey: string, liveClicks: LiveSocialClickRow[]): number {
  const hit = liveClicks.find((row) => {
    const channel = (row.channel || '').toLowerCase()
    const label = (row.label || '').toLowerCase()
    return (
      channel === platform ||
      channel === platformKey.toLowerCase() ||
      label.includes(platform) ||
      label.includes(platformKey.toLowerCase())
    )
  })
  return Number(hit?.clickCount || 0)
}

/** Build social click chips from card handles + live EventLog click rows. */
export function getCardSocialClickStats(card: VCardRecord, liveClicks: LiveSocialClickRow[] = []): SocialClickStat[] {
  const handles = card.social?.handles || {}
  const entries = Object.entries(handles).filter(([, value]) => !!String(value || '').trim())
  const seen = new Set<string>()
  const rows: SocialClickStat[] = []

  for (const [platformKey, url] of entries) {
    const platform = resolveSocialPlatform(platformKey)
    const key = `${platform}-${url || platformKey}`
    if (seen.has(platform)) continue
    seen.add(platform)
    rows.push({
      key,
      platform,
      label: displayName(platform),
      clickCount: clickCountFor(platform, platformKey, liveClicks),
      tone: toneFor(platform),
    })
  }

  for (const row of liveClicks) {
    const platform = resolveSocialPlatform(row.channel || row.label || 'web')
    if (seen.has(platform)) continue
    if (!row.clickCount) continue
    seen.add(platform)
    rows.push({
      key: row.channel || platform,
      platform,
      label: row.label || displayName(platform),
      clickCount: Number(row.clickCount) || 0,
      tone: toneFor(platform),
    })
  }

  return rows.sort((a, b) => b.clickCount - a.clickCount)
}
