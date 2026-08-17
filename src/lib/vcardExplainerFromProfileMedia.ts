import { getDisplaySettingsFromVCard, getFieldConfig, patchDisplayField } from '@/lib/vcardDisplaySettings'
import { PUBLIC_SECTION_NAMES } from '@/lib/vcardPublicSectionNames'
import type { VCardData, VCardSectionPostItem } from '@/types/vcard'

export const PROFILE_MEDIA_EXPLAINER_SOURCE = 'profile-media'
export const INTRO_VIDEO_FIELD = 'Intro vCard Video'
export const INTRO_YOUTUBE_FIELD = 'Intro YouTube vCard Video Link'
export const PROFILE_MEDIA_EXPLAINER_TEMP_ID = 'sec_profile_media'

const EXPLAINER_SECTION = PUBLIC_SECTION_NAMES.explainer

export function isYoutubeMediaUrl(url: string): boolean {
  return /youtu\.?be/i.test(url)
}

function isPersistableUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed || trimmed.startsWith('blob:')) return false
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')
}

function firstPersistable(urls: Array<string | undefined | null>): string {
  for (const raw of urls) {
    const value = raw?.trim() || ''
    if (value && isPersistableUrl(value)) return value
  }
  return ''
}

export function readProfileMediaExplainer(data: VCardData): { fileUrl: string; externalUrl: string } {
  const settings = getDisplaySettingsFromVCard(data)
  const introFile = getFieldConfig(settings, INTRO_VIDEO_FIELD).customValue?.trim() || ''
  const introYoutube = getFieldConfig(settings, INTRO_YOUTUBE_FIELD).customValue?.trim() || ''
  const personal = data.personal.explainerVideoUrl?.trim() || ''

  const fileUrl = introFile && !isYoutubeMediaUrl(introFile) && isPersistableUrl(introFile) ? introFile : ''
  const externalUrl = firstPersistable([
    personal,
    introYoutube,
    introFile && isYoutubeMediaUrl(introFile) ? introFile : '',
  ])

  return { fileUrl, externalUrl }
}

export function explainerTabSignature(data: VCardData): string {
  return JSON.stringify(data.sectionPosts?.[EXPLAINER_SECTION] ?? [])
}

function findProfileMediaIndex(items: VCardSectionPostItem[], fileUrl: string, externalUrl: string): number {
  const bySource = items.findIndex((item) => item.metas?.source === PROFILE_MEDIA_EXPLAINER_SOURCE)
  if (bySource >= 0) return bySource

  const byUrl = items.findIndex((item) => {
    const image = item.featuredImage?.trim() || ''
    const url = item.url?.trim() || ''
    return (
      (fileUrl && (image === fileUrl || url === fileUrl)) ||
      (externalUrl && (url === externalUrl || image === externalUrl))
    )
  })
  if (byUrl >= 0) return byUrl

  if (items.length === 1) {
    const only = items[0]
    const empty = !only.featuredImage?.trim() && !only.url?.trim()
    if (empty) return 0
  }

  return -1
}

export function applyProfileMediaToExplainerTab(
  data: VCardData,
  options?: { syncYoutubeFromPersonal?: boolean }
): VCardData {
  let settings = getDisplaySettingsFromVCard(data)
  if (options?.syncYoutubeFromPersonal) {
    settings = patchDisplayField(settings, INTRO_YOUTUBE_FIELD, {
      customValue: data.personal.explainerVideoUrl?.trim() || '',
    })
  }

  const withSettings: VCardData = { ...data, displaySettings: settings }
  const { fileUrl, externalUrl } = readProfileMediaExplainer(withSettings)
  const existing = [...(data.sectionPosts?.[EXPLAINER_SECTION] || [])]
  const index = findProfileMediaIndex(existing, fileUrl, externalUrl)

  let nextItems = existing
  if (!fileUrl && !externalUrl) {
    nextItems = existing.filter((item) => item.metas?.source !== PROFILE_MEDIA_EXPLAINER_SOURCE)
  } else {
    const previous = index >= 0 ? existing[index] : null
    const item: VCardSectionPostItem = {
      id: previous?.id || PROFILE_MEDIA_EXPLAINER_TEMP_ID,
      title: previous?.title?.trim() ? previous.title : '2D Video Explainer',
      description: previous?.description || '',
      url: externalUrl || fileUrl,
      featuredImage: fileUrl,
      date: previous?.date || '',
      rating: previous?.rating || '',
      location: previous?.location || '',
      active: true,
      metas: { ...(previous?.metas || {}), source: PROFILE_MEDIA_EXPLAINER_SOURCE },
    }
    if (index >= 0) {
      nextItems = existing.map((entry, i) => (i === index ? item : entry))
    } else {
      nextItems = [item, ...existing]
    }
  }

  let personal = data.personal
  if (externalUrl && isYoutubeMediaUrl(externalUrl)) {
    settings = patchDisplayField(settings, INTRO_YOUTUBE_FIELD, { customValue: externalUrl })
    if (personal.explainerVideoUrl?.trim() !== externalUrl) {
      personal = { ...personal, explainerVideoUrl: externalUrl }
    }
  }

  const next: VCardData = {
    ...data,
    personal,
    displaySettings: settings,
    sectionPosts: {
      ...(data.sectionPosts || {}),
      [EXPLAINER_SECTION]: nextItems,
    },
  }

  if (
    explainerTabSignature(next) === explainerTabSignature(data) &&
    next.personal.explainerVideoUrl === data.personal.explainerVideoUrl &&
    getFieldConfig(getDisplaySettingsFromVCard(data), INTRO_YOUTUBE_FIELD).customValue ===
      getFieldConfig(settings, INTRO_YOUTUBE_FIELD).customValue
  ) {
    return data
  }

  return next
}

export function isExplainerMediaPath(path: string): boolean {
  return path === 'displaySettings' || path.startsWith('displaySettings.') || path === 'personal.explainerVideoUrl'
}
