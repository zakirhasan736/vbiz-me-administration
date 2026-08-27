'use client'

import { MediaSourceActions } from '@/components/MediaSourceActions'
import { PackageFeatureLockNote } from '@/components/PackageFeatureLockNote'
import { VCardMediaField } from '@/components/vcard/VCardMediaField'
import { useMediaUploadLimit, usePackageAccess } from '@/hooks/usePackageAccess'
import { useVCard } from '@/lib/VCardContext'
import { perFileUploadLimitLabel } from '@/lib/packageAccess'
import { useVCardDisplayEditor } from '@/lib/useVCardDisplayEditor'
import { isLocalTempId } from '@/redux/features/profiles/profiles.api'
import { Film, Image as ImageIcon, Link as LinkIcon, User } from 'lucide-react'

const FIELD_BG = 'Background Video/Image'
const FIELD_AVATAR = 'Profile Image/Video'
const FIELD_INTRO = 'Intro vCard Video'

export function Tab1MediaProfile() {
  const { cardId, vCardData, updateData, updateMeta, avatarImageUrl } = useVCard()
  const { getCustomValue, setCustomValue } = useVCardDisplayEditor()
  const { can } = usePackageAccess()
  const uploadLimit = useMediaUploadLimit()
  const limitLabel = perFileUploadLimitLabel(uploadLimit)
  const canAvatarVideo = can('allow_video_upload')
  const canBgVideo = can('allow_background_video_upload')
  const canExplainer = can('allow_2d_explainer')

  const profileMediaUrl = getCustomValue(FIELD_BG)
  const profilePicUrl = getCustomValue(FIELD_AVATAR) || avatarImageUrl || ''
  const explainerUrl = getCustomValue(FIELD_INTRO)
  const externalUrl = vCardData.personal.explainerVideoUrl || ''
  const profileId = cardId && !isLocalTempId(cardId) ? cardId : undefined

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
          onChange={(url) => setCustomValue(FIELD_BG, url || '')}
          profileId={profileId}
          attachmentType={FIELD_BG}
          accept={canBgVideo ? 'image/*,video/*' : 'image/*'}
          allowVideo={canBgVideo}
          maxBytes={uploadLimit.maxBytes}
          title="Profile Background"
          subtitle={`Video/Image • ${limitLabel}`}
          icon={<ImageIcon className="text-primary-600 dark:text-primary-400 h-5 w-5" />}
          selectPlaceholder="Select file"
          previewKind="auto"
          placeholderImage="https://images.unsplash.com/photo-1555952517-2e8e729e0b44?auto=format&fit=crop&w=800&q=80"
        >
          <MediaSourceActions
            mode={canBgVideo ? 'both' : 'image'}
            compact
            className="mt-3"
            onSelect={(asset) => setCustomValue(FIELD_BG, asset.url)}
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
          accept={canAvatarVideo ? 'image/*,video/*' : 'image/*'}
          allowVideo={canAvatarVideo}
          maxBytes={uploadLimit.maxBytes}
          title="Avatar"
          subtitle={`Image or video • ${limitLabel}`}
          icon={<User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          iconWrapperClassName="border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
          selectPlaceholder="Select image"
          previewKind="auto"
          videoAutoPlay
          previewClassName="h-75"
          placeholderImage="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80"
        >
          <MediaSourceActions
            mode={canAvatarVideo ? 'both' : 'image'}
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
            locked={!canExplainer}
            allowVideo={canExplainer}
            maxBytes={uploadLimit.maxBytes}
            title="2D Video Explainer"
            subtitle={`Shown as your explainer section. ${limitLabel}.`}
            icon={<Film className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            iconWrapperClassName="border-purple-100 bg-purple-50 dark:border-purple-500/20 dark:bg-purple-500/10"
            selectPlaceholder="Select video"
            previewKind="video"
            emptyIcon={<Film className="h-10 w-10 text-slate-300 dark:text-slate-600" />}
          >
            <MediaSourceActions
              mode="video"
              compact
              className="mt-3"
              onSelect={(asset) => setCustomValue(FIELD_INTRO, asset.url)}
            />
          </VCardMediaField>

          <div className="rounded-3xl border border-slate-200/50 bg-slate-50/50 p-6 shadow-sm dark:border-white/5 dark:bg-white/2">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-rose-100 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10">
                <LinkIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h4 className="text-[15px] leading-none font-black text-slate-900 dark:text-white">
                  External Video URL
                </h4>
                <p className="mt-1.5 text-[12px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  YouTube / Vimeo
                </p>
              </div>
            </div>
            <div className="focus-within:border-primary-500/50 focus-within:ring-primary-500/50 group flex overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all focus-within:ring-1 dark:border-white/10 dark:bg-[#0b0f19]">
              <span className="flex items-center justify-center border-r border-slate-200/80 bg-slate-50 px-5 py-4 text-[12px] font-bold tracking-wider text-slate-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400">
                URL
              </span>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => updateData('personal.explainerVideoUrl', e.target.value)}
                placeholder="https://"
                disabled={!canExplainer}
                className="w-full bg-transparent px-5 py-4 text-[13px] font-medium text-slate-900 transition-colors outline-none placeholder:text-slate-500 disabled:opacity-60 dark:text-white"
              />
            </div>
            {canExplainer ? null : <PackageFeatureLockNote className="mt-3" />}
          </div>
        </div>
      </div>
    </div>
  )
}
