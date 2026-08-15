import { isVideoAvatarSrc } from '@/lib/push/resolveNotificationAvatar'
import { resolvePwaAvatarUrl, resolvePwaDisplayName } from '@/lib/pwa/resolvePublicCardPwa'
import { brandColorsFromThemeConfig, hasDynamicTheme, resolveCardThemeConfig } from '@/lib/theme/resolveCardTheme'
import type { MyCardData } from '@interfaces/api/myCard'

export const WALLET_TEMPLATE_VERSION = 2

export const DEFAULT_WALLET_THEME = {
  primary: '#0B1F3A',
  secondary: '#C9A24A',
} as const

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export type WalletArtFormat = 'card' | 'hero' | 'strip' | 'wide'

export const WALLET_ART_SIZE: Record<WalletArtFormat, { width: number; height: number }> = {
  card: { width: 1012, height: 638 },
  hero: { width: 1032, height: 812 },
  strip: { width: 1125, height: 432 },
  wide: { width: 1280, height: 400 },
}

export type WalletPassTheme = {
  primary: string
  secondary: string
  text: string
  mutedText: string
  qrDark: string
  qrLight: string
}

export type WalletPassModel = {
  name: string
  designation: string
  photoUrl: string | null
  initials: string
  cardUrl: string
  theme: WalletPassTheme
  templateVersion: number
}

function firstHex(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed && HEX_RE.test(trimmed)) return trimmed.toUpperCase()
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

function expandHex(hex: string): string {
  let h = hex.replace('#', '')
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  return `#${h.toLowerCase()}`
}

function hexLuminance(hex: string): number {
  const h = expandHex(hex).slice(1)
  const r = Number.parseInt(h.slice(0, 2), 16) / 255
  const g = Number.parseInt(h.slice(2, 4), 16) / 255
  const b = Number.parseInt(h.slice(4, 6), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function mixHex(hex: string, toward: string, amount: number): string {
  const a = expandHex(hex).slice(1)
  const b = expandHex(toward).slice(1)
  const mix = (from: number, to: number) => Math.round(from + (to - from) * amount)
  const r = mix(Number.parseInt(a.slice(0, 2), 16), Number.parseInt(b.slice(0, 2), 16))
  const g = mix(Number.parseInt(a.slice(2, 4), 16), Number.parseInt(b.slice(2, 4), 16))
  const bl = mix(Number.parseInt(a.slice(4, 6), 16), Number.parseInt(b.slice(4, 6), 16))
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, '0')).join('')}`
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

export function resolveOwnerBrandColors(card: MyCardData | null | undefined): { primary: string; secondary: string } {
  if (hasDynamicTheme(card?.theme_config)) {
    const template =
      card?.template === 'v1' || card?.template === 'dynamic' ? 'v1' : card?.template === 'v2' ? 'v2' : 'v3'
    const cfg = resolveCardThemeConfig(card?.theme_config, template)
    const brand = brandColorsFromThemeConfig(cfg, cfg.colors.defaultMode === 'light' ? 'light' : 'dark')
    const primary = firstHex(brand.primaryColor, brand.accentColor)
    const secondary = firstHex(brand.accentColor, brand.primaryColor)
    if (primary) {
      return {
        primary,
        secondary: secondary && secondary !== primary ? secondary : mixHex(primary, '#ffffff', 0.28),
      }
    }
  }
  const fromSettings = parseThemeJson(card?.settings?.theme_json)
  const primary = firstHex(fromSettings?.primaryColor, fromSettings?.accentColor)
  const secondary = firstHex(fromSettings?.accentColor, fromSettings?.primaryColor)
  if (primary) {
    return {
      primary,
      secondary: secondary && secondary !== primary ? secondary : mixHex(primary, '#ffffff', 0.28),
    }
  }
  return { ...DEFAULT_WALLET_THEME }
}

export function resolveWalletPassTheme(card: MyCardData | null | undefined): WalletPassTheme {
  const { primary, secondary } = resolveOwnerBrandColors(card)
  const darkBg = hexLuminance(primary) <= 0.55
  const text = darkBg ? '#FFFFFF' : '#111111'
  const mutedText = darkBg ? 'rgba(255,255,255,0.82)' : 'rgba(17,17,17,0.72)'
  return {
    primary,
    secondary,
    text,
    mutedText,
    qrDark: '#111111',
    qrLight: '#FFFFFF',
  }
}

export function resolveWalletPhotoUrl(card: MyCardData | null | undefined): string | null {
  if (!card) return null
  return (
    resolvePwaAvatarUrl(card) ||
    stillImageUrl(card.profile_media?.url) ||
    stillImageUrl(card.settings?.company_icon_url)
  )
}

export function resolveWalletPassModel(
  card: MyCardData | null | undefined,
  slug: string,
  origin?: string
): WalletPassModel {
  const name = resolvePwaDisplayName(card?.profile?.name, slug)
  let photoUrl = resolveWalletPhotoUrl(card)
  if (photoUrl?.startsWith('/') && origin) photoUrl = `${origin.replace(/\/$/, '')}${photoUrl}`
  const designation = card?.profile?.designation?.trim() || card?.profile?.company_name?.trim() || ''
  const path = `/v/${encodeURIComponent(slug.trim())}`
  return {
    name,
    designation,
    photoUrl,
    initials: initialsFromName(name),
    cardUrl: origin ? `${origin.replace(/\/$/, '')}${path}` : path,
    theme: resolveWalletPassTheme(card),
    templateVersion: WALLET_TEMPLATE_VERSION,
  }
}

export function parseWalletArtFormat(value?: string | null): WalletArtFormat {
  if (value === 'hero' || value === 'strip' || value === 'wide') return value
  return 'card'
}
