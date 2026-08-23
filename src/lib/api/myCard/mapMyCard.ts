import { AI_ASSISTANCE_SETTING_KEY, isAiAssistanceEnabled } from '@/lib/aiAssistance'
import {
  CUSTOM_TABS_SETTING_KEY,
  parseThemeJson,
  TAB_LABEL_OVERRIDES_SETTING_KEY,
  THEME_SETTING_KEY,
} from '@/lib/api/myCard/mapDisplaySettingsToApi'
import { resolveProfileTemplateFromMyCard } from '@/lib/api/myCard/resolveProfileTemplate'
import { decodeHtmlText } from '@/lib/htmlText'
import { parseSeoSettings } from '@/lib/seo/cardSeo'
import { getStaticProfileTheme } from '@/lib/staticProfileThemes'
import { hasDynamicTheme, resolveCardThemeConfig } from '@/lib/theme/resolveCardTheme'
import { applyEnabledNavOrderToDisplaySettings } from '@/lib/vcardDisplaySettings'
import { MY_INFO_SETTING_KEY, parseMyInfoJson } from '@/lib/vcardMyInfo'
import { createDefaultNavFieldConfig, LOCKED_NAV_ITEM_IDS, NAV_BAR_FIELDS, NAV_BAR_NAV_ITEMS } from '@/lib/vcardNavbar'
import { createDefaultVCardSocial } from '@/lib/vcardSocial'
import type { ProfileTemplateId } from '@/redux/features/designSettings/designSettings.slice'
import type {
  VCardCustomTab,
  VCardData,
  VCardExtraField,
  VCardPersonal,
  VCardRecord,
  VCardSocial,
  VCardTheme,
} from '@/types/vcard'
import type { VCardDisplaySettings } from '@/types/vcardDisplaySettings'
import { createDefaultFieldConfig } from '@/types/vcardDisplaySettings'
import type { MyCardData, MyCardMyInfoField } from '@interfaces/api/myCard'

const CHECKBOX_ON = new Set(['1', 'true'])

function isEnabled(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (value == null) return false
  return CHECKBOX_ON.has(String(value))
}

/** Card Settings nav toggles — one API checkbox may enable multiple nav labels. */
const API_NAV_TO_LABELS: Record<string, string[]> = {
  navHome_checkbox: ['Home'],
  aboutMeNav_checkbox: ['About Me'],
  businessNav_checkbox: ['Company Mission Statement'],
  navResume_checkbox: ['Resume'],
  serviceNav_checkbox: ['Services'],
  galleryNav_checkbox: ['Gallery'],
  portfolioNav_checkbox: ['Gallery'],
  blogNav_checkbox: ['Blog'],
  faqNav_checkbox: ['Faq'],
  pCardsNav_checkbox: ['Public Cards'],
  contactNav_checkbox: ['Contact Us'],
  testimonialNav_checkbox: ['Reviews'],
  meetingNav_checkbox: ['Calender'],
  certificationNav_checkbox: ['Certifications/Licenses', 'Insurance License'],
  licensingNav_checkbox: ['Licensing'],
  '2dNav_checkbox': ['2D Explainer'],
  videoLinksNav_checkbox: ['Video Links'],
  meetOurTeamNav_checkbox: ['Meet Our Team'],
  bbbNav_checkbox: ['BBB'],
  dcpNav_checkbox: ['Department of Consumer Protection (DCP)'],
  restaurantMenuNav_checkbox: ['Menu'],
  solarNav_checkbox: ['Home Solar'],
  salesPersonNav_checkbox: ['24/h SalesPerson'],
  seeproduct_checkbox: ['See Product'],
  partnershipNav_checkbox: ['Clients'],
  bgNav_checkbox: ['Nav Background Color'],
}

function isNavCheckboxEnabled(card: MyCardData, apiKey: string): boolean {
  const { settings, features } = card
  return isEnabled(settings[apiKey]) || isEnabled(features[apiKey.replace('_checkbox', '')])
}

const API_FIELD_TO_LABEL: Record<string, string> = {
  name_checkbox: 'MyInfo section Name',
  profession_checkbox: 'MyInfo Profession',
  company_name_checkbox: 'MyInfo Company',
  address_checkbox: 'MyInfo Address',
  email_checkbox: 'MyInfo Email',
  phone_checkbox: 'MyInfo Phone',
  whatsapp_checkbox: 'MyInfo Whatsapp',
  website_checkbox: 'MyInfo Website',
  gender_id_checkbox: 'Gender',
  marital_status_checkbox: 'MyInfo Relationship Status',
  about_checkbox: 'About Me',
  save_contact_checkbox: 'Save Contact',
  share_checkbox: 'Share Btn',
  my_info_checkbox: 'My Info Btn',
  my_vcard_checkbox: 'My vCard Btn',
  get_vcard_now_checkbox: 'Get your VCard Now',
  qr_code_checkbox: 'Your QR Code',
  home_page_bg_checkbox: 'Home Page BG Color',
  home_page_banner_checkbox: 'Home Page Banner Color',
  facebook_checkbox: 'FaceBook',
  twitter_checkbox: 'Twitter',
  instagram_checkbox: 'Instagram',
  tiktok_checkbox: 'TikTok',
  youtube_checkbox: 'Youtube',
  linkin_checkbox: 'LinkedIn',
  linkedin_checkbox: 'LinkedIn',
  pinterest_checkbox: 'Pinterest',
  rumble_checkbox: 'Rumble',
  truth_checkbox: 'Truth',
  profile_video_checkbox: 'Intro vCard Video',
  profile_video_link_checkbox: 'Intro YouTube vCard Video Link',
  background_video_checkbox: 'Background Video/Image',
  bg_video_checkbox: 'Background Video/Image',
  profile_image_checkbox: 'Profile Image/Video',
  background_music_checkbox: 'Background Music',
  background_music_link_checkbox: 'YouTube Background Music Link',
  repeat_bg_music_checkbox: 'Repeat Background Music',
  pageHeader_checkbox: 'Pages Header',
  viewCounter_checkbox: 'Vcard View Counter',
  language_checkbox: 'Language',
  crm_checkbox: 'CRM',
  website_link_checkbox: 'Website',
  professionIcon_checkbox: 'Profession Icon',
  company_nameIcon_checkbox: 'Company/Office Icon',
  websiteIcon_checkbox: 'My Info Website Icon',
}

function readMyInfoFieldIcon(section: Record<string, MyCardMyInfoField> | undefined, fieldKeys: string[]): string {
  if (!section) return ''
  for (const key of fieldKeys) {
    const icon = section[key]?.icon?.trim()
    if (!icon) continue
    if (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/') || icon.startsWith('data:')) {
      return icon
    }
  }
  return ''
}

function isYoutubeMediaUrl(url: string): boolean {
  return /youtu\.?be/i.test(url)
}

function isDurableHttpUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed || trimmed.startsWith('blob:')) return false
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')
}

function parseDisplaySettingsSnapshot(raw?: string): VCardDisplaySettings | null {
  if (!raw?.trim()) return null
  try {
    const parsed = JSON.parse(raw) as VCardDisplaySettings
    if (!parsed || typeof parsed !== 'object' || !parsed.fields || typeof parsed.fields !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function parseCustomTabs(raw?: string): VCardCustomTab[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((tab): tab is Partial<VCardCustomTab> => Boolean(tab && typeof tab === 'object'))
      .map((tab) => ({
        id: typeof tab.id === 'string' ? tab.id : '',
        label: decodeHtmlText(typeof tab.label === 'string' && tab.label.trim() ? tab.label : 'Custom tab'),
        items: Array.isArray(tab.items)
          ? (tab.items as unknown[]).map((raw) => {
              const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
              return {
                id: typeof item.id === 'string' ? item.id : '',
                title: decodeHtmlText(typeof item.title === 'string' ? item.title : ''),
                description: typeof item.description === 'string' ? item.description : '',
                url: typeof item.url === 'string' ? item.url : '',
                mediaUrl: typeof item.mediaUrl === 'string' ? item.mediaUrl : '',
                mediaName: typeof item.mediaName === 'string' ? item.mediaName : '',
                mediaKind: item.mediaKind as VCardCustomTab['items'][number]['mediaKind'],
                gallery: Array.isArray(item.gallery) ? item.gallery : [],
                active: item.active !== false,
              }
            })
          : [],
      }))
      .filter((tab) => tab.id.startsWith('custom-tab-'))
  } catch {
    return []
  }
}

function parseTabLabelOverrides(raw?: string): Record<string, string> {
  if (!raw?.trim()) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([id, label]) => [id, typeof label === 'string' ? decodeHtmlText(label.trim()) : ''] as const)
        .filter(([, label]) => Boolean(label))
    )
  } catch {
    return {}
  }
}

function mapDisplaySettings(card: MyCardData): VCardDisplaySettings {
  const { settings, features } = card
  const snapshot = parseDisplaySettingsSnapshot(settings.display_settings_json)
  const fields: VCardDisplaySettings['fields'] = {}

  if (snapshot?.fields) {
    for (const [label, config] of Object.entries(snapshot.fields)) {
      const customValue = config.customValue?.trim() || ''
      fields[label] = {
        ...createDefaultFieldConfig(),
        ...config,
        customValue: customValue.startsWith('blob:') ? '' : customValue,
      }
    }
  }

  for (const key of NAV_BAR_FIELDS) {
    fields[key] = fields[key] || createDefaultNavFieldConfig(key)
  }

  const editorNavOrder = Array.isArray(snapshot?.editorNavOrder)
    ? snapshot.editorNavOrder.filter((id): id is string => typeof id === 'string' && Boolean(id))
    : []

  if (!editorNavOrder.length) {
    for (const item of NAV_BAR_NAV_ITEMS) {
      fields[item.label] = {
        ...(fields[item.label] || createDefaultNavFieldConfig(item.label)),
        visible: LOCKED_NAV_ITEM_IDS.has(item.id),
      }
    }
    for (const [apiKey, labels] of Object.entries(API_NAV_TO_LABELS)) {
      const visible = isNavCheckboxEnabled(card, apiKey)
      for (const label of labels) {
        if (label === 'Nav Background Color') continue
        if (!fields[label]) continue
        fields[label] = { ...fields[label], visible }
      }
    }
    for (const item of NAV_BAR_NAV_ITEMS) {
      if (!LOCKED_NAV_ITEM_IDS.has(item.id)) continue
      fields[item.label] = { ...(fields[item.label] || createDefaultNavFieldConfig(item.label)), visible: true }
    }
  }

  for (const label of new Set(Object.values(API_FIELD_TO_LABEL))) {
    if (!fields[label]) {
      fields[label] = createDefaultFieldConfig()
    }
  }

  for (const [apiKey, label] of Object.entries(API_FIELD_TO_LABEL)) {
    const featureKey = apiKey.replace('_checkbox', '')
    if (settings[apiKey] === undefined && features[featureKey] === undefined) continue
    const visible = isEnabled(settings[apiKey]) || isEnabled(features[featureKey])
    fields[label] = { ...fields[label], visible }
  }

  if (!snapshot?.fields?.Share && fields['Share Btn']) {
    fields['Share'] = { ...(fields['Share'] || createDefaultFieldConfig()), visible: fields['Share Btn'].visible }
  }

  const ACTION_BUTTON_TO_LABEL: Record<string, string> = {
    my_info: 'My Info Btn',
    save_contact: 'Save Contact',
    share: 'Share Btn',
    language: 'Language',
    view_counter: 'Vcard View Counter',
  }

  for (const [key, label] of Object.entries(ACTION_BUTTON_TO_LABEL)) {
    const button = card.action_buttons[key]
    if (button?.enabled === undefined) continue

    fields[label] = {
      ...fields[label],
      visible: button.enabled === true,
    }
  }

  const viewCounter = card.action_buttons.view_counter
  if (viewCounter?.enabled === true) {
    fields['Vcard View Counter'] = { ...fields['Vcard View Counter'], visible: true }
  } else if (viewCounter?.enabled === false) {
    fields['Vcard View Counter'] = { ...fields['Vcard View Counter'], visible: false }
  }

  const introYoutube = settings.intro_youtube_url?.trim() || card.intro_video.youtube?.link?.trim() || ''
  const introFileCandidate =
    settings.intro_video_url?.trim() ||
    card.intro_video.regular_video?.url?.trim() ||
    card.intro_video.url?.trim() ||
    ''
  const introFile = introFileCandidate && !isYoutubeMediaUrl(introFileCandidate) ? introFileCandidate : ''
  const introYoutubeFallback =
    introYoutube ||
    (introFileCandidate && isYoutubeMediaUrl(introFileCandidate) ? introFileCandidate : '') ||
    card.intro_video.youtube?.embed_url?.trim() ||
    ''

  if (introFile) {
    fields['Intro vCard Video'] = {
      ...fields['Intro vCard Video'],
      customValue: introFile,
    }
  }
  if (introYoutubeFallback) {
    fields['Intro YouTube vCard Video Link'] = {
      ...fields['Intro YouTube vCard Video Link'],
      customValue: introYoutube || introYoutubeFallback,
    }
  }

  const bgUrl = settings.background_media_url || card.background_media.video_url || card.background_media.url || ''
  if (bgUrl && isDurableHttpUrl(bgUrl)) {
    fields['Background Video/Image'] = {
      ...fields['Background Video/Image'],
      customValue: bgUrl,
    }
  }

  const profileUrl =
    settings.profile_media_url?.trim() || card.profile_media.url || card.profile_media.fallback_url || ''
  if (profileUrl && isDurableHttpUrl(profileUrl)) {
    fields['Profile Image/Video'] = {
      ...fields['Profile Image/Video'],
      customValue: profileUrl,
    }
  }

  const audio = card.background_audio
  const musicFileUrl =
    settings.background_music_file_url?.trim() || (!audio?.use_youtube_link && audio?.url?.trim()) || ''
  if (musicFileUrl && isDurableHttpUrl(musicFileUrl) && !isYoutubeMediaUrl(musicFileUrl)) {
    fields['Background Music'] = {
      ...fields['Background Music'],
      customValue: musicFileUrl,
    }
  }

  const musicYoutubeUrl =
    settings.background_music_url?.trim() ||
    (audio?.use_youtube_link ? audio.youtube?.link || audio.youtube?.embed_url || '' : '') ||
    ''
  if (musicYoutubeUrl && isYoutubeMediaUrl(musicYoutubeUrl)) {
    fields['YouTube Background Music Link'] = {
      ...fields['YouTube Background Music Link'],
      customValue: musicYoutubeUrl,
    }
  }

  const companyIcon =
    readMyInfoFieldIcon(card.my_info.professional, ['company_name', 'company', 'company_office']) ||
    readMyInfoFieldIcon(card.my_info.personal, ['company_name', 'company'])
  if (companyIcon) {
    fields['Company/Office Icon'] = {
      ...fields['Company/Office Icon'],
      customValue: companyIcon,
    }
  }

  const next: VCardDisplaySettings = {
    globalEnabled: snapshot?.globalEnabled ?? true,
    fields,
    ...(editorNavOrder.length ? { editorNavOrder } : {}),
  }
  return editorNavOrder.length ? applyEnabledNavOrderToDisplaySettings(next, editorNavOrder) : next
}

function mapPersonal(card: MyCardData): VCardPersonal {
  const p = card.profile
  const aboutSection = card.my_info.personal?.about?.value ?? p.description ?? ''
  const contactPhone = card.my_info.contact?.phone?.value?.trim() || ''
  const contactEmail = card.my_info.contact?.email?.value?.trim() || ''
  const contactWhatsapp = card.my_info.contact?.whatsapp?.value?.trim() || ''

  return {
    fullName: decodeHtmlText(p.name ?? ''),
    email: p.email || contactEmail,
    dob: card.my_info.personal?.dob?.value ?? '',
    gender: decodeHtmlText(p.gender ?? card.my_info.personal?.gender?.value ?? 'Male'),
    relationship: decodeHtmlText(p.marital_status ?? card.my_info.personal?.marital_status?.value ?? 'Single'),
    profession: decodeHtmlText(p.profession ?? ''),
    designation: decodeHtmlText(p.designation ?? ''),
    company: decodeHtmlText(p.company_name ?? ''),
    phone: p.phone || contactPhone,
    whatsapp: p.whatsapp || contactWhatsapp || p.phone || contactPhone,
    address: decodeHtmlText(p.address ?? ''),
    website: p.website ?? '',
    about: decodeHtmlText(aboutSection),
    explainerVideoUrl: (() => {
      const fromSettings = card.settings?.intro_video_url?.trim() || ''
      const file =
        (fromSettings && !isYoutubeMediaUrl(fromSettings) ? fromSettings : '') ||
        card.intro_video.regular_video?.url?.trim() ||
        (card.intro_video.youtube ? '' : card.intro_video.url?.trim()) ||
        ''
      return file && !isYoutubeMediaUrl(file) ? file : ''
    })(),
  }
}

function mapSocial(card: MyCardData): VCardSocial {
  const p = card.profile
  const base = createDefaultVCardSocial()
  const handles: Record<string, string> = {
    ...base.handles,
    facebook: p.facebook ?? '',
    instagram: p.instagram ?? '',
    twitter: p.twitter ?? '',
    tiktok: p.tiktok ?? '',
    youtube: p.youtube ?? '',
    linkedin: p.linkedin ?? '',
    pinterest: p.pinterest ?? '',
    whatsapp: p.whatsapp ?? '',
    rumble: p.rumble ?? '',
    truth: p.truth ?? '',
    website: p.website ?? '',
  }

  const customLinks =
    card.my_info.additional_fields?.map((field, index) => ({
      id: `extra_${index}_${field.key}`,
      name: decodeHtmlText(field.key),
      url: field.value,
    })) ?? []

  return { ...base, handles, customLinks }
}

function mapExtraFields(card: MyCardData): VCardExtraField[] {
  return (
    card.my_info.additional_fields?.map((field, index) => ({
      id: `api_extra_${index}`,
      icon: field.icon ?? field.css_class ?? 'fa-link',
      name: decodeHtmlText(field.key),
      value: decodeHtmlText(field.value),
    })) ?? []
  )
}

function resolveTemplate(card: MyCardData): ProfileTemplateId {
  return resolveProfileTemplateFromMyCard(card)
}

function resolveTheme(card: MyCardData): VCardTheme {
  const staticTheme = getStaticProfileTheme(resolveTemplate(card))
  const fromJson = parseThemeJson(card.settings?.[THEME_SETTING_KEY])
  if (!fromJson) return staticTheme
  return {
    primaryColor: fromJson.primaryColor || staticTheme.primaryColor,
    accentColor: fromJson.accentColor || staticTheme.accentColor,
    darkMode: typeof fromJson.darkMode === 'boolean' ? fromJson.darkMode : staticTheme.darkMode,
    fontFamily: fromJson.fontFamily || staticTheme.fontFamily,
  }
}

function resolveAppearance(card: MyCardData): VCardData['appearance'] {
  const template = resolveTemplate(card)
  const cfg = hasDynamicTheme(card.theme_config) ? resolveCardThemeConfig(card.theme_config, template) : null
  return {
    profileTemplate: template,
    layoutStyle: cfg?.appearance.layoutStyle ?? 'classic',
    buttonStyle: cfg?.appearance.buttonStyle ?? 'solid',
    cornerStyle: cfg?.appearance.cornerStyle ?? 'round',
    buttonShadow: cfg?.appearance.buttonShadow ?? 'none',
  }
}

export function mapMyCardToVCardData(card: MyCardData): VCardData {
  return {
    slug: card.profile.slug,
    isPublic: card.features.is_public !== false,
    isDraft: card.features.is_draft === true,
    personal: mapPersonal(card),
    theme: resolveTheme(card),
    appearance: resolveAppearance(card),
    services: [],
    generalPosts: [],
    faqs: [],
    portfolio: [],
    socials: [],
    social: mapSocial(card),
    extraFields: mapExtraFields(card),
    myInfo: parseMyInfoJson(card.settings?.[MY_INFO_SETTING_KEY]),
    seo: parseSeoSettings(card.settings || {}),
    education: [],
    experience: [],
    displaySettings: mapDisplaySettings(card),
    customTabs: parseCustomTabs(card.settings?.[CUSTOM_TABS_SETTING_KEY]),
    tabLabelOverrides: parseTabLabelOverrides(card.settings?.[TAB_LABEL_OVERRIDES_SETTING_KEY]),
    themeConfig: hasDynamicTheme(card.theme_config)
      ? resolveCardThemeConfig(card.theme_config, resolveTemplate(card))
      : undefined,
    aiAssistanceEnabled: isAiAssistanceEnabled(
      card.settings?.[AI_ASSISTANCE_SETTING_KEY] ?? card.features?.aiAssistance,
      card.profile.slug
    ),
  }
}

export function mapMyCardToVCardRecord(card: MyCardData): VCardRecord {
  const data = mapMyCardToVCardData(card)
  const now = new Date().toISOString()
  const settingsProfile =
    typeof card.settings?.profile_media_url === 'string' ? card.settings.profile_media_url.trim() : ''
  const settingsLogo =
    typeof card.settings?.company_logo === 'string'
      ? card.settings.company_logo.trim()
      : typeof card.settings?.company_icon_url === 'string'
        ? card.settings.company_icon_url.trim()
        : ''
  const stillImage = [
    settingsProfile,
    card.profile_media.url,
    card.profile_media.fallback_url,
    card.profile.avatar,
    settingsLogo,
    data.displaySettings?.fields?.['Profile Image/Video']?.customValue,
    data.displaySettings?.fields?.['Company/Office Icon']?.customValue,
  ]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .find((url) => (/^https?:\/\//i.test(url) || url.startsWith('/')) && !/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url))
  const avatarImageUrl = stillImage || ''

  const settingsBackground =
    typeof card.settings?.background_media_url === 'string' ? card.settings.background_media_url.trim() : ''
  const background =
    settingsBackground ||
    card.background_media.video_url ||
    card.background_media.url ||
    data.displaySettings?.fields?.['Background Video/Image']?.customValue?.trim() ||
    ''
  const backgroundImageUrl = background && isDurableHttpUrl(background) ? background : ''

  return {
    ...data,
    id: String(card.profile.id),
    createdAt: now,
    updatedAt: now,
    views: card.action_buttons.view_counter?.count ?? 0,
    saves: 0,
    avatarImageUrl,
    backgroundImageUrl,
    isActive: true,
  }
}
