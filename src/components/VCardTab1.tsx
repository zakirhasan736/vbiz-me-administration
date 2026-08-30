'use client'

import { MediaSourceActions } from '@/components/MediaSourceActions'
import { VCardMediaField } from '@/components/vcard/VCardMediaField'
import { useVCard } from '@/lib/VCardContext'
import { inferMediaWallpaperStyle, patchThemeConfigWallpaper } from '@/lib/theme/wallpaper'
import { useVCardDisplayEditor } from '@/lib/useVCardDisplayEditor'
import { isLocalTempId } from '@/redux/features/profiles/profiles.api'
import { Film, Image as ImageIcon, Link as LinkIcon, User } from 'lucide-react'
import { useCallback } from 'react'

const FIELD_BG = 'Background Video/Image'
const FIELD_AVATAR = 'Profile Image/Video'
const FIELD_INTRO = 'Intro vCard Video'

export function Tab1MediaProfile() {
  const { cardId, vCardData, updateData, updateMeta, avatarImageUrl } = useVCard()
  const { getCustomValue, setCustomValue } = useVCardDisplayEditor()
  const templateId = vCardData.appearance?.profileTemplate ?? 'v3'

  const profileMediaUrl = getCustomValue(FIELD_BG)
  const profilePicUrl = getCustomValue(FIELD_AVATAR) || avatarImageUrl || ''
  const explainerUrl = getCustomValue(FIELD_INTRO)
  const externalUrl = vCardData.personal.explainerVideoUrl || ''
  const profileId = cardId && !isLocalTempId(cardId) ? cardId : undefined

  const setBackgroundMedia = useCallback(
    (url: string) => {
      setCustomValue(FIELD_BG, url || '')
      const trimmed = url.trim()
      if (!trimmed) return
      const next = inferMediaWallpaperStyle(trimmed)
      updateData('themeConfig', patchThemeConfigWallpaper(vCardData.themeConfig, { style: next }, templateId))
    },
    [setCustomValue, templateId, updateData, vCardData.themeConfig]
  )

  return (
    <div className="animate-in fade-in mx-auto w-full max-w-7xl pb-12 duration-500">
      <div className="bg-primary-50/50 dark:bg-primary-500/2 border-primary-100 dark:border-primary-500/10 mb-8 rounded-3xl border p-6">
        <h3 className="text-primary-600 dark:text-primary-400 mb-2 text-lg font-black">Profile Media</h3>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Upload your profile photo, video and 2D explainer. All are optional but help you stand out. The 2D explainer
          also fills the 2D Video Explainer tab on your public card.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        <VCardMediaField
          value={profileMediaUrl}
          onChange={(url) => setBackgroundMedia(url || '')}
          profileId={profileId}
          attachmentType={FIELD_BG}
          accept="image/*,video/*"
          allowVideo
          title="Profile Background"
          subtitle="Video or image • no size limit"
          icon={<ImageIcon className="text-primary-600 dark:text-primary-400 h-5 w-5" />}
          selectPlaceholder="Select file"
          previewKind="auto"
        >
          <MediaSourceActions
            mode="both"
            compact
            className="mt-3"
            onSelect={(asset) => setBackgroundMedia(asset.url)}
          />
        </VCardMediaField>

        <VCardMediaField
          value={profilePicUrl}
          onChange={(url) => {
            setCustomValue(FIELD_AVATAR, url || '')
            updateMeta({ avatarImageUrl: url || '' })
          }}
          profileId={profileId}
          attachmentType={FIELD_AVATAR}
          accept="image/*,video/*"
          allowVideo
          title="Avatar"
          subtitle="Image or video • no size limit"
          icon={<User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          iconWrapperClassName="border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
          selectPlaceholder="Select image"
          previewKind="auto"
          videoAutoPlay
          previewClassName="h-75"
        >
          <MediaSourceActions
            mode="both"
            compact
            className="mt-3"
            onSelect={(asset) => {
              setCustomValue(FIELD_AVATAR, asset.url)
              updateMeta({ avatarImageUrl: asset.url })
            }}
          />
        </VCardMediaField>

        <div className="space-y-6">
          <VCardMediaField
            value={explainerUrl}
            onChange={(url) => setCustomValue(FIELD_INTRO, url || '')}
            profileId={profileId}
            attachmentType={FIELD_INTRO}
            accept="video/*"
            allowVideo
            title="2D Explainer Video"
            subtitle="Plays as intro + 2D Explainer tab • no size limit"
            icon={<Film className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
            iconWrapperClassName="border-violet-100 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/10"
            selectPlaceholder="Select video"
            previewKind="video"
            previewClassName="aspect-video max-h-56"
            emptyIcon={<Film className="h-10 w-10 text-slate-300 dark:text-slate-600" />}
          >
            <MediaSourceActions
              mode="video"
              compact
              className="mt-3"
              onSelect={(asset) => setCustomValue(FIELD_INTRO, asset.url)}
            />
          </VCardMediaField>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-black tracking-widest text-slate-400 uppercase">
              <LinkIcon className="h-3.5 w-3.5" /> External / YouTube URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={externalUrl}
                onChange={(e) => updateData('personal.explainerVideoUrl', e.target.value)}
                placeholder="https://youtube.com/… or direct video URL"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none dark:border-white/10 dark:bg-[#070a13] dark:text-white"
              />
              {externalUrl.trim() ? (
                <button
                  type="button"
                  onClick={() => updateData('personal.explainerVideoUrl', '')}
                  className="shrink-0 rounded-2xl border border-rose-200 bg-rose-50 px-3 text-[12px] font-bold text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
