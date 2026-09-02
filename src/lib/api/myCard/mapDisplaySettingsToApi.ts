import { AI_ASSISTANCE_SETTING_KEY, isAiAssistanceEnabled } from '@/lib/aiAssistance'
import { seoToApiSettings } from '@/lib/seo/cardSeo'
import { mapMyInfoToApiSettings } from '@/lib/vcardMyInfo'
import type { VCardData, VCardExtraField, VCardTheme } from '@/types/vcard'
import type { VCardDisplaySettings } from '@/types/vcardDisplaySettings'

/** Mirrors public myCard checkbox → label maps (write path). */
export const LABEL_TO_NAV_CHECKBOX: Record<string, string> = {
  Home: 'navHome_checkbox',
  'About Me': 'aboutMeNav_checkbox',
  'Company Mission Statement': 'businessNav_checkbox',
  Resume: 'navResume_checkbox',
  Services: 'serviceNav_checkbox',
  Gallery: 'galleryNav_checkbox',
  Blog: 'blogNav_checkbox',
  Faq: 'faqNav_checkbox',
  'Public Cards': 'pCardsNav_checkbox',
  'Contact Us': 'contactNav_checkbox',
  Reviews: 'testimonialNav_checkbox',
  Calender: 'meetingNav_checkbox',
  'Certifications/Licenses': 'certificationNav_checkbox',
  'Insurance License': 'certificationNav_checkbox',
  Licensing: 'licensingNav_checkbox',
  '2D Explainer': '2dNav_checkbox',
  'Video Links': 'videoLinksNav_checkbox',
  'Meet Our Team': 'meetOurTeamNav_checkbox',
  BBB: 'bbbNav_checkbox',
  'Department of Consumer Protection (DCP)': 'dcpNav_checkbox',
  DCP: 'dcpNav_checkbox',
  Menu: 'restaurantMenuNav_checkbox',
  'Home Solar': 'solarNav_checkbox',
  '24/h SalesPerson': 'salesPersonNav_checkbox',
  'See Product': 'seeproduct_checkbox',
  Clients: 'partnershipNav_checkbox',
  'Nav Background Color': 'bgNav_checkbox',
  Skills: 'skillsNav_checkbox',
  'Work Experience': 'experienceNav_checkbox',
  Education: 'educationNav_checkbox',
  Profile: 'profileNav_checkbox',
  'Global Connection': 'globalConnectionNav_checkbox',
  'My Info': 'myInfoNav_checkbox',
  'Content & media': 'contentMediaNav_checkbox',
  Videos: 'videoLinksNav_checkbox',
  Post: 'blogNav_checkbox',
  'Additional Services': 'serviceNav_checkbox',
  Announcement: 'blogNav_checkbox',
  Booking: 'meetingNav_checkbox',
  Events: 'meetingNav_checkbox',
  Breakfast: 'restaurantMenuNav_checkbox',
  Lunch: 'restaurantMenuNav_checkbox',
  Dinner: 'restaurantMenuNav_checkbox',
  Inventory: 'seeproduct_checkbox',
  'Join My Team': 'meetOurTeamNav_checkbox',
  'Press/Media': 'blogNav_checkbox',
  'Property Listing': 'seeproduct_checkbox',
  'Resiliency Products': 'solarNav_checkbox',
  'Who We Are': 'aboutMeNav_checkbox',
}

const LABEL_TO_FIELD_CHECKBOX: Record<string, string> = {
  'MyInfo section Name': 'name_checkbox',
  'MyInfo Profession': 'profession_checkbox',
  'MyInfo Company': 'company_name_checkbox',
  'MyInfo Address': 'address_checkbox',
  'MyInfo Email': 'email_checkbox',
  'MyInfo Phone': 'phone_checkbox',
  'MyInfo Whatsapp': 'whatsapp_checkbox',
  'MyInfo Website': 'website_checkbox',
  Gender: 'gender_id_checkbox',
  'MyInfo Relationship Status': 'marital_status_checkbox',
  'About Me': 'about_checkbox',
  'Save Contact': 'save_contact_checkbox',
  'Share Btn': 'share_checkbox',
  Share: 'share_checkbox',
  'My Info Btn': 'my_info_checkbox',
  'My vCard Btn': 'my_vcard_checkbox',
  'Your QR Code': 'my_vcard_checkbox',
  'Get your VCard Now': 'get_vcard_now_checkbox',
  'Home Page BG Color': 'home_page_bg_checkbox',
  'Home Page Banner Color': 'home_page_banner_checkbox',
  FaceBook: 'facebook_checkbox',
  Twitter: 'twitter_checkbox',
  Instagram: 'instagram_checkbox',
  TikTok: 'tiktok_checkbox',
  Youtube: 'youtube_checkbox',
  LinkedIn: 'linkedin_checkbox',
  Pinterest: 'pinterest_checkbox',
  Rumble: 'rumble_checkbox',
  Truth: 'truth_checkbox',
  'Intro vCard Video': 'profile_video_checkbox',
  'Intro YouTube vCard Video Link': 'profile_video_link_checkbox',
  'Background Video/Image': 'background_video_checkbox',
  'Profile Image/Video': 'profile_image_checkbox',
  'Background Music': 'background_music_checkbox',
  'YouTube Background Music Link': 'background_music_link_checkbox',
  'Repeat Background Music': 'repeat_bg_music_checkbox',
  'Pages Header': 'pageHeader_checkbox',
  'Vcard View Counter': 'viewCounter_checkbox',
  Language: 'language_checkbox',
  CRM: 'crm_checkbox',
  Website: 'website_link_checkbox',
  'Profession Icon': 'professionIcon_checkbox',
  'Company/Office Icon': 'company_nameIcon_checkbox',
  'My Info Website Icon': 'websiteIcon_checkbox',
}

const CUSTOM_VALUE_SETTING_KEYS: Record<string, string> = {
  'Intro vCard Video': 'intro_video_url',
  'Background Video/Image': 'background_media_url',
  'Profile Image/Video': 'profile_media_url',
  'Company/Office Icon': 'company_icon_url',
  'Background Music': 'background_music_file_url',
  'YouTube Background Music Link': 'background_music_url',
  'Intro YouTube vCard Video Link': 'intro_youtube_url',
}

export const EXTRA_FIELDS_SETTING_KEY = 'extra_fields_json'
export const DISPLAY_SETTINGS_SETTING_KEY = 'display_settings_json'
export const THEME_SETTING_KEY = 'theme_json'
export const CUSTOM_TABS_SETTING_KEY = 'custom_tabs_json'
export const TAB_LABEL_OVERRIDES_SETTING_KEY = 'tab_label_overrides_json'

function checkboxValue(visible: boolean | undefined): string {
  return visible === false ? '0' : '1'
}

function isPersistableMediaUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || trimmed.startsWith('blob:')) return false
  return true
}

/**
 * Convert editor `displaySettings` into backend `Setting` key/value rows
 * (checkbox toggles + a full JSON snapshot for round-trip).
 */
export function mapDisplaySettingsToApiSettings(
  displaySettings: VCardDisplaySettings | undefined
): Record<string, string> {
  const settings: Record<string, string> = {}
  if (!displaySettings) return settings

  settings[DISPLAY_SETTINGS_SETTING_KEY] = JSON.stringify(displaySettings)

  for (const [label, field] of Object.entries(displaySettings.fields || {})) {
    const navKey = LABEL_TO_NAV_CHECKBOX[label]
    if (navKey) settings[navKey] = checkboxValue(field.visible)

    const fieldKey = LABEL_TO_FIELD_CHECKBOX[label]
    if (fieldKey) settings[fieldKey] = checkboxValue(field.visible)

    const customKey = CUSTOM_VALUE_SETTING_KEYS[label]
    const custom = field.customValue?.trim()
    if (customKey && custom && isPersistableMediaUrl(custom)) settings[customKey] = custom
    // Empty clears are written by DELETE /media/clear so we don't wipe legacy
    // attachment-backed media on every autosave of untouched empty fields.
  }

  // Compat: public MyCard historically reads bg_video_checkbox
  if (settings.background_video_checkbox !== undefined) {
    settings.bg_video_checkbox = settings.background_video_checkbox
  }

  // Keep gallery/portfolio nav keys in sync
  if (settings.galleryNav_checkbox !== undefined) {
    settings.portfolioNav_checkbox = settings.galleryNav_checkbox
  }

  return settings
}

export function mapExtraFieldsToApiSettings(extraFields: VCardExtraField[] | undefined): Record<string, string> {
  if (!extraFields?.length) return {}
  return { [EXTRA_FIELDS_SETTING_KEY]: JSON.stringify(extraFields) }
}

export function mapThemeToApiSettings(data: Pick<VCardData, 'theme'>): Record<string, string> {
  if (!data.theme) return {}
  return { [THEME_SETTING_KEY]: JSON.stringify(data.theme) }
}

function mapCustomTabsToApiSettings(data: VCardData): Record<string, string> {
  const settings: Record<string, string> = {
    [CUSTOM_TABS_SETTING_KEY]: JSON.stringify(data.customTabs || []),
  }
  if (data.tabLabelOverrides && Object.keys(data.tabLabelOverrides).length) {
    settings[TAB_LABEL_OVERRIDES_SETTING_KEY] = JSON.stringify(data.tabLabelOverrides)
  }
  return settings
}

/** Parse persisted `theme_json` setting back into a partial theme. */
export function parseThemeJson(raw?: string | null): Partial<VCardTheme> | null {
  if (!raw?.trim()) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const theme = parsed as Partial<VCardTheme>
    return {
      ...(typeof theme.primaryColor === 'string' ? { primaryColor: theme.primaryColor } : {}),
      ...(typeof theme.secondaryColor === 'string' ? { secondaryColor: theme.secondaryColor } : {}),
      ...(typeof theme.accentColor === 'string' ? { accentColor: theme.accentColor } : {}),
      ...(typeof theme.darkMode === 'boolean' ? { darkMode: theme.darkMode } : {}),
      ...(typeof theme.fontFamily === 'string' && theme.fontFamily.trim()
        ? { fontFamily: theme.fontFamily.trim() }
        : {}),
    }
  } catch {
    return null
  }
}

/** Merge all persistable editor settings into one `settings` map for PATCH /profiles/:id. */
export function mapVCardEditorSettingsPayload(data: VCardData): Record<string, string> {
  return {
    ...mapDisplaySettingsToApiSettings(data.displaySettings),
    ...mapExtraFieldsToApiSettings(data.extraFields),
    ...mapThemeToApiSettings(data),
    ...mapCustomTabsToApiSettings(data),
    ...mapMyInfoToApiSettings(data.myInfo, data.personal),
    ...seoToApiSettings(data.seo),
    [AI_ASSISTANCE_SETTING_KEY]: isAiAssistanceEnabled(data.aiAssistanceEnabled) ? '1' : '0',
  }
}
