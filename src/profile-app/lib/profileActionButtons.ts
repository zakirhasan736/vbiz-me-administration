import { openGoogleWalletInNewTab } from '@/profile-app/lib/googleWallet'
import { openVbizmeLogin, openVbizmePricing, reloadProfileCard } from '@/profile-app/lib/profileExternalLinks'
import type { MyCardActionButton, MyCardActionButtons } from '@interfaces/api/myCard'
import { ArrowUpRight, Download, Eye, Globe, QrCode, RefreshCw, Share2, User, type LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'

export type ProfileActionButtonKey = 'my_info' | 'save_contact' | 'share' | 'refresh' | 'language' | 'view_counter'

/** Fixed home-page CTAs (left column). Marked buttons always render. */
export type HomeCtaKey = 'my_info' | 'save_my_info' | 'my_vcard' | 'google_wallet' | 'get_vcard_now'

/** Theme button role — maps to theme_config.components.button.{primary|secondary|accent}. */
export type HomeCtaButtonRole = 'primary' | 'secondary' | 'accent'

export type ResolvedHomeCtaButton = {
  key: HomeCtaKey
  label: string
  icon: LucideIcon
  backgroundColor?: string
  textColor?: string
  /** Visual variant (legacy). Prefer `role` for theme tokens. */
  variant: 'outline' | 'accent' | 'cta'
  /** primary = CTA, accent = filled brand, secondary = outline. */
  role: HomeCtaButtonRole
}

export type HomeCtaLayout = {
  /** Ordered rows — a row of 2 buttons renders side-by-side; a row of 1 renders full-width. */
  rows: ResolvedHomeCtaButton[][]
}

/** @deprecated Use ResolvedHomeCtaButton for home section CTAs. */
export type ResolvedProfileActionButton = {
  key: ProfileActionButtonKey
  label: string
  icon: LucideIcon
  backgroundColor?: string
  textColor?: string
  count?: number
  link?: string
}

const HOME_CTA_DEFAULT_LABELS: Record<HomeCtaKey, string> = {
  my_info: 'MY INFO',
  save_my_info: 'SAVE MY INFO',
  my_vcard: 'MY VCARD',
  google_wallet: 'SAVE TO WALLET',
  get_vcard_now: 'GET YOUR VCARD NOW',
}

function resolveSaveMyInfoButton(
  actionButtons: MyCardActionButtons | null | undefined,
  labels: Partial<Record<HomeCtaKey, string>>
): ResolvedHomeCtaButton {
  const api = actionButtons?.save_contact
  return {
    key: 'save_my_info',
    label: (api?.label?.trim() || labels.save_my_info || HOME_CTA_DEFAULT_LABELS.save_my_info).toUpperCase(),
    icon: resolveFaIcon(api?.icon, Download),
    variant: 'outline',
    role: 'secondary',
  }
}

export function resolveHomeCtaLayout(options: {
  actionButtons?: MyCardActionButtons | null
  labels?: Partial<Record<HomeCtaKey, string>>
  accentColor?: string
  /** When true, adds a leading "My Info" button (opens the info popup) and pairs Save My Info with Save To Wallet — used on mobile. */
  includeMyInfo?: boolean
}): HomeCtaLayout {
  const { actionButtons, labels = {}, includeMyInfo = false } = options

  const saveMyInfo = resolveSaveMyInfoButton(actionButtons, labels)

  // accent button — filled brand (MY VCARD)
  const myVcard: ResolvedHomeCtaButton = {
    key: 'my_vcard',
    label: (labels.my_vcard ?? HOME_CTA_DEFAULT_LABELS.my_vcard).toUpperCase(),
    icon: QrCode,
    variant: 'accent',
    role: 'accent',
  }

  // secondary button — outline (SAVE TO WALLET)
  const googleWallet: ResolvedHomeCtaButton = {
    key: 'google_wallet',
    label: (labels.google_wallet ?? HOME_CTA_DEFAULT_LABELS.google_wallet).toUpperCase(),
    icon: Download,
    variant: 'outline',
    role: 'secondary',
  }

  // primary button — main CTA (GET YOUR VCARD NOW)
  const getVcardNow: ResolvedHomeCtaButton = {
    key: 'get_vcard_now',
    label: (labels.get_vcard_now ?? HOME_CTA_DEFAULT_LABELS.get_vcard_now).toUpperCase(),
    icon: ArrowUpRight,
    variant: 'cta',
    role: 'primary',
  }

  // secondary button — outline (MY INFO)
  const myInfo: ResolvedHomeCtaButton = {
    key: 'my_info',
    label: (labels.my_info ?? HOME_CTA_DEFAULT_LABELS.my_info).toUpperCase(),
    icon: User,
    variant: 'outline',
    role: 'secondary',
  }

  const rows: ResolvedHomeCtaButton[][] = includeMyInfo
    ? [[myInfo, myVcard], [saveMyInfo, googleWallet], [getVcardNow]]
    : [[saveMyInfo, myVcard], [googleWallet], [getVcardNow]]

  return { rows }
}

export function handleHomeCtaClick(
  key: HomeCtaKey,
  handlers?: {
    onAction?: (action: string) => void
    cardSlug?: string
  }
) {
  switch (key) {
    case 'my_info':
      if (handlers?.onAction) {
        handlers.onAction('info')
        return
      }
      window.dispatchEvent(new CustomEvent('openMyInfoModal'))
      return
    case 'save_my_info':
      // Only the dedicated Save Contact button opens the save-contact popup.
      if (handlers?.onAction) {
        handlers.onAction('contact')
        return
      }
      window.dispatchEvent(new CustomEvent('saveContactAction'))
      return
    case 'my_vcard':
      reloadProfileCard()
      return
    case 'get_vcard_now':
      openVbizmePricing()
      return
    case 'google_wallet':
      void openGoogleWalletInNewTab(handlers?.cardSlug)
      return
    default:
      return
  }
}

/**
 * Optional per-button overrides only. Theme tokens (primary/secondary/accent)
 * drive fill/foreground/border via `.vbiz-btn[data-role]`.
 */
export function buildHomeCtaInlineStyle(
  button: ResolvedHomeCtaButton,
  _accentColor?: string
): CSSProperties | undefined {
  const style: CSSProperties = {}
  if (button.backgroundColor) style.background = button.backgroundColor
  if (button.textColor) style.color = button.textColor
  return Object.keys(style).length > 0 ? style : undefined
}

/** Utility actions rendered in the card header sidebar (right rail). */
export const SIDEBAR_ACTION_BUTTON_ORDER: ProfileActionButtonKey[] = ['view_counter', 'language', 'share']

export const HOME_ACTION_BUTTON_ORDER: ProfileActionButtonKey[] = [...SIDEBAR_ACTION_BUTTON_ORDER]

const FA_ICON_MAP: Record<string, LucideIcon> = {
  'fa-user': User,
  'fa-user-circle': User,
  'fa-download': Download,
  'fa-share-alt': Share2,
  'fa-share': Share2,
  'fa-sync-alt': RefreshCw,
  'fa-sync': RefreshCw,
  'fa-language': Globe,
  'fa-globe': Globe,
  'fa-eye': Eye,
}

const DEFAULT_LABELS: Record<ProfileActionButtonKey, string> = {
  my_info: 'My Info',
  save_contact: 'Save Contact',
  share: 'Share',
  refresh: 'Refresh',
  language: 'Language',
  view_counter: 'Views',
}

const DEFAULT_ICONS: Record<ProfileActionButtonKey, LucideIcon> = {
  my_info: User,
  save_contact: Download,
  share: Share2,
  refresh: RefreshCw,
  language: Globe,
  view_counter: Eye,
}

export function resolveFaIcon(icon?: string, fallback: LucideIcon = User): LucideIcon {
  if (!icon?.trim()) return fallback
  const normalized = icon.trim().toLowerCase()
  return FA_ICON_MAP[normalized] ?? fallback
}

function resolveButton(
  key: ProfileActionButtonKey,
  button: MyCardActionButton | undefined,
  profileViews: number
): ResolvedProfileActionButton | null {
  if (!button?.enabled) return null

  const label =
    key === 'view_counter' && button.count != null
      ? `${button.label?.trim() || DEFAULT_LABELS.view_counter} (${button.count})`
      : button.label?.trim() || DEFAULT_LABELS[key]

  return {
    key,
    label: label.toUpperCase(),
    icon: resolveFaIcon(button.icon, DEFAULT_ICONS[key]),
    count: button.count ?? (key === 'view_counter' ? profileViews : undefined),
    link: button.link,
  }
}

export function getEnabledSidebarActionButtons(
  actionButtons: MyCardActionButtons | null | undefined,
  profileViews = 0
): ResolvedProfileActionButton[] {
  if (!actionButtons) return []

  return SIDEBAR_ACTION_BUTTON_ORDER.flatMap((key) => {
    const resolved = resolveButton(key, actionButtons[key], profileViews)
    return resolved ? [resolved] : []
  })
}

export function isProfileActionButtonEnabled(
  key: ProfileActionButtonKey,
  actionButtons: MyCardActionButtons | null | undefined,
  isVisible: (fieldKey: string) => boolean
): boolean {
  if (actionButtons) {
    return actionButtons[key]?.enabled === true
  }

  if (key === 'refresh') return false

  const legacyMap: Record<Exclude<ProfileActionButtonKey, 'refresh'>, string> = {
    my_info: 'My Info Btn',
    save_contact: 'Save Contact',
    share: 'Share Btn',
    language: 'Language',
    view_counter: 'Vcard View Counter',
  }

  return isVisible(legacyMap[key as Exclude<ProfileActionButtonKey, 'refresh'>])
}

export function handleProfileActionButtonClick(
  key: ProfileActionButtonKey,
  button: ResolvedProfileActionButton,
  handlers?: {
    onAction?: (action: string) => void
    onLanguage?: () => void
    onShare?: () => void
  }
) {
  if (key === 'refresh') {
    window.location.reload()
    return
  }

  if (key === 'view_counter') {
    openVbizmeLogin()
    return
  }

  if (key === 'language') {
    if (handlers?.onAction) {
      handlers.onAction('language')
      return
    }
    handlers?.onLanguage?.()
    return
  }

  if (key === 'share') {
    if (handlers?.onAction) {
      handlers.onAction('share')
      return
    }
    handlers?.onShare?.()
    window.dispatchEvent(new CustomEvent('openShareModal'))
    return
  }

  if (key === 'my_info') {
    if (handlers?.onAction) {
      handlers.onAction('info')
      return
    }
    window.dispatchEvent(new CustomEvent('openMyInfoModal'))
    return
  }

  if (key === 'save_contact') {
    if (handlers?.onAction) {
      handlers.onAction('contact')
      return
    }
    window.dispatchEvent(new CustomEvent('saveContactAction'))
  }
}

export function buildActionButtonInlineStyle(
  button: ResolvedProfileActionButton,
  accentColor?: string
): CSSProperties | undefined {
  const style: CSSProperties = {}
  if (button.key === 'save_contact' && accentColor) {
    style.background = `linear-gradient(to right, ${accentColor}, color-mix(in srgb, ${accentColor} 75%, black))`
  }
  return Object.keys(style).length > 0 ? style : undefined
}
