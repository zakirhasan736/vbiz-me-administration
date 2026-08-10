export type SocialPlatformKey = 'facebook' | 'twitter' | 'instagram' | 'whatsapp' | 'linkedin' | 'youtube' | 'web'

export type SocialClickStat = {
  key: string
  platform: SocialPlatformKey
  label: string
  clickCount: number
  tone: string
}

type ClickRow = { label?: string; channel?: string; url?: string; clickCount?: number }

type SocialInputItem = { platform?: unknown; label?: unknown; url?: unknown }

function isSocialInputItem(value: unknown): value is SocialInputItem {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeSocials(socials: unknown): { platform: string; url?: string }[] {
  if (!socials) return []
  if (Array.isArray(socials)) {
    return socials.filter(isSocialInputItem).map((s) => ({
      platform: String(s.platform || s.label || 'Link'),
      url: s.url == null ? undefined : String(s.url),
    }))
  }
  if (typeof socials !== 'object') return []
  return Object.entries(socials as Record<string, unknown>)
    .filter(([, url]) => !!url)
    .map(([platform, url]) => ({ platform, url: String(url) }))
}

export function resolveSocialPlatform(platform: string): SocialPlatformKey {
  const p = platform.toLowerCase()
  if (p.includes('facebook')) return 'facebook'
  if (p.includes('twitter') || p === 'x' || p.includes('x.com')) return 'twitter'
  if (p.includes('instagram')) return 'instagram'
  if (p.includes('whatsapp')) return 'whatsapp'
  if (p.includes('linkedin')) return 'linkedin'
  if (p.includes('youtube')) return 'youtube'
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
      return 'bg-emerald-50/70 dark:bg-emerald-500/10 text-emerald-500 border-emerald-100/50 dark:border-emerald-500/20'
    case 'linkedin':
      return 'bg-blue-50/70 dark:bg-[#0A66C2]/10 text-[#0A66C2] border-blue-100/50 dark:border-[#0A66C2]/20'
    case 'youtube':
      return 'bg-red-50/70 dark:bg-red-500/10 text-red-500 border-red-100/50 dark:border-red-500/20'
    default:
      return 'bg-purple-50/70 dark:bg-purple-500/10 text-purple-600 border-purple-100/50 dark:border-purple-500/20'
  }
}

/** Build social click chips for a card (uses link clicks when available). */
export function getCardSocialClickStats(
  card: { id?: string; slug?: string; socials?: unknown },
  linkClicks: ClickRow[] = []
): SocialClickStat[] {
  // Only platforms actually configured on the card (no invented defaults)
  const socials = normalizeSocials(card.socials).filter((s) => s.platform && String(s.platform).trim().length > 0)

  if (socials.length === 0) return []

  return socials.map((s, idx) => {
    const platform = resolveSocialPlatform(s.platform)
    const hit = linkClicks.find((l) => {
      const channel = (l.channel || '').toLowerCase()
      const rowLabel = (l.label || '').toLowerCase()
      if (channel && (channel === platform || channel.includes(platform))) return true
      if (rowLabel.includes(s.platform.toLowerCase())) return true
      if (s.url && l.url === s.url) return true
      return false
    })
    return {
      key: `${platform}-${idx}-${s.url || s.platform}`,
      platform,
      label: displayName(platform),
      // Live clicks only — 0 until visitors click (no seeded fake counts)
      clickCount: Number(hit?.clickCount || 0),
      tone: toneFor(platform),
    }
  })
}
