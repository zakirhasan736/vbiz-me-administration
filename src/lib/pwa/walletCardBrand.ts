import { isVideoAvatarSrc } from '@/lib/push/resolveNotificationAvatar'
import { resolvePwaAvatarUrl, resolvePwaDisplayName } from '@/lib/pwa/resolvePublicCardPwa'
import { brandColorsFromThemeConfig, hasDynamicTheme, resolveCardThemeConfig } from '@/lib/theme/resolveCardTheme'
import type { MyCardData } from '@interfaces/api/myCard'

const DEFAULT_ACCENT = '#C9A24A'
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export type WalletArtFormat = 'card' | 'hero' | 'strip'

export const WALLET_ART_SIZE: Record<WalletArtFormat, { width: number; height: number }> = {
  card: { width: 1012, height: 638 },
  /** Google generic hero (1032×812). Card is letterboxed so proportions stay exact. */
  hero: { width: 1032, height: 812 },
  /** Apple Wallet strip @3x. Card is letterboxed so proportions stay exact. */
  strip: { width: 1125, height: 432 },
}

export type WalletCardBrand = {
  name: string
  roleLine: string
  accent: string
  logoUrl: string | null
  initials: string
  cardUrl: string
}

function firstHex(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed && HEX_RE.test(trimmed)) return trimmed
  }
  return null
}

function parseThemeJson(raw?: string): { accentColor?: string; primaryColor?: string } | null {
  if (!raw?.trim()) return null
  try {
    const parsed = JSON.parse(raw) as { accentColor?: string; primaryColor?: string }
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'V'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function stillImageUrl(url?: string | null): string | null {
  const trimmed = url?.trim()
  if (!trimmed || isVideoAvatarSrc(trimmed)) return null
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed
  return null
}

export function resolveWalletAccent(card: MyCardData | null | undefined): string {
  if (hasDynamicTheme(card?.theme_config)) {
    const template =
      card?.template === 'v1' || card?.template === 'dynamic' ? 'v1' : card?.template === 'v2' ? 'v2' : 'v3'
    const cfg = resolveCardThemeConfig(card?.theme_config, template)
    const brand = brandColorsFromThemeConfig(cfg, cfg.colors.defaultMode === 'light' ? 'light' : 'dark')
    const hex = firstHex(brand.accentColor, brand.primaryColor)
    if (hex) return hex
  }
  const fromSettings = parseThemeJson(card?.settings?.theme_json)
  return firstHex(fromSettings?.accentColor, fromSettings?.primaryColor) || DEFAULT_ACCENT
}

export function resolveWalletLogoUrl(card: MyCardData | null | undefined): string | null {
  if (!card) return null
  return (
    stillImageUrl(card.settings?.company_icon_url) ||
    resolvePwaAvatarUrl(card) ||
    stillImageUrl(card.profile_media?.url)
  )
}

export function resolveWalletRoleLine(card: MyCardData | null | undefined): string {
  const designation = card?.profile?.designation?.trim() || ''
  const company = card?.profile?.company_name?.trim() || ''
  if (designation && company) return `${designation} | ${company}`
  return designation || company
}

export function resolveWalletCardBrand(
  card: MyCardData | null | undefined,
  slug: string,
  origin?: string
): WalletCardBrand {
  const name = resolvePwaDisplayName(card?.profile?.name, slug)
  let logoUrl = resolveWalletLogoUrl(card)
  if (logoUrl?.startsWith('/') && origin) logoUrl = `${origin.replace(/\/$/, '')}${logoUrl}`
  const path = `/v/${encodeURIComponent(slug.trim())}`
  const cardUrl = origin ? `${origin.replace(/\/$/, '')}${path}` : path
  return {
    name,
    roleLine: resolveWalletRoleLine(card),
    accent: resolveWalletAccent(card),
    logoUrl,
    initials: initialsFromName(name),
    cardUrl,
  }
}

export function parseWalletArtFormat(value?: string | null): WalletArtFormat {
  if (value === 'hero' || value === 'strip') return value
  return 'card'
}
