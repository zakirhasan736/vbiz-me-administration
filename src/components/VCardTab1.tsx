'use client'

import { useVCard } from '@/lib/VCardContext'
import { isVideoUrl } from '@/lib/mediaUrl'
import { useVCardDisplayEditor } from '@/lib/useVCardDisplayEditor'
import { Film, Image as ImageIcon, Link as LinkIcon, Upload, User, X } from 'lucide-react'
import Image from 'next/image'
import { useRef } from 'react'

const FIELD_BG = 'Background Video/Image'
const FIELD_AVATAR = 'Profile Image/Video'
const FIELD_INTRO = 'Intro vCard Video'

function fileLabelFromUrl(url: string) {
  if (!url) return ''
  try {
    if (url.startsWith('blob:')) return 'Uploaded file'
    const name = new URL(url).pathname.split('/').pop()
    return name || 'Media file'
  } catch {
    return 'Media file'
  }
}

export function Tab1MediaProfile() {
  const { vCardData, updateData, updateMeta } = useVCard()
  const { getCustomValue, setCustomValue } = useVCardDisplayEditor()

  const profileMediaUrl = getCustomValue(FIELD_BG)
  const profilePicUrl = getCustomValue(FIELD_AVATAR)
  const explainerUrl = getCustomValue(FIELD_INTRO)
  const externalUrl = vCardData.personal.explainerVideoUrl || ''

  const mediaInputRef = useRef<HTMLInputElement>(null)
  const picInputRef = useRef<HTMLInputElement>(null)
  const explainerInputRef = useRef<HTMLInputElement>(null)

  const applyFile = (file: File, fieldKey: string, onMeta?: (url: string) => void) => {
    const url = URL.createObjectURL(file)
    setCustomValue(fieldKey, url)
    onMeta?.(url)
  }

  return (
    <div className="animate-in fade-in mx-auto w-full max-w-7xl pb-12 duration-500">
      <div className="bg-primary-50/50 dark:bg-primary-500/2 border-primary-100 dark:border-primary-500/10 mb-8 rounded-[24px] border p-6">
        <h3 className="text-primary-600 dark:text-primary-400 mb-2 text-lg font-black">Profile Media & Assets</h3>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Upload your profile photo, video and 2D explainer. All are optional but highly recommended to help your vCard
          stand out.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="rounded-[24px] border border-slate-200/50 bg-slate-50/50 p-6 shadow-sm dark:border-white/5 dark:bg-white/2">
            <div className="mb-5 flex items-center gap-4">
              <div className="bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 flex h-10 w-10 items-center justify-center rounded-[14px] border">
                <ImageIcon className="text-primary-600 dark:text-primary-400 h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[15px] leading-none font-black text-slate-900 dark:text-white">
                  Profile Background
                </h4>
                <p className="mt-1.5 text-[12px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Video/Image • Max 2MB
                </p>
              </div>
            </div>
            <div className="focus-within:border-primary-500/50 group relative flex overflow-hidden rounded-[16px] border border-slate-200/80 bg-white shadow-sm transition-all dark:border-white/10 dark:bg-[#0b0f19]">
              <input
                type="file"
                ref={mediaInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) applyFile(file, FIELD_BG)
                }}
              />
              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                className="flex cursor-pointer items-center gap-2 border-r border-slate-200/80 bg-slate-50 px-5 py-4 text-[13px] font-bold whitespace-nowrap text-slate-900 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800/50 dark:text-white dark:hover:bg-slate-800"
              >
                <Upload className="h-4 w-4" /> Browse
              </button>
              <span className="flex w-full items-center truncate px-5 py-4 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                {profileMediaUrl ? fileLabelFromUrl(profileMediaUrl) : 'Select file'}
              </span>
            </div>
          </div>
          <div className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-[24px] border border-slate-200/50 bg-slate-50/50 shadow-sm dark:border-white/5 dark:bg-white/2">
            {profileMediaUrl ? (
              isVideoUrl(profileMediaUrl) ? (
                <video src={profileMediaUrl} controls className="h-full w-full object-cover" />
              ) : (
                <Image
                  src={profileMediaUrl}
                  alt="Media"
                  className="h-full w-full object-cover"
                  width={800}
                  height={800}
                />
              )
            ) : (
              <Image
                src="https://images.unsplash.com/photo-1555952517-2e8e729e0b44?auto=format&fit=crop&w=800&q=80"
                alt="Video thumbnail"
                className="h-full w-full object-cover opacity-10 grayscale transition-all duration-500 group-hover:opacity-20"
                width={800}
                height={800}
              />
            )}
            {!profileMediaUrl && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="rounded-full bg-white/50 px-4 py-2 text-sm font-bold tracking-widest text-slate-900/40 uppercase backdrop-blur-md dark:bg-black/50 dark:text-white/30">
                  Preview
                </p>
              </div>
            )}
            {profileMediaUrl && (
              <button
                type="button"
                onClick={() => setCustomValue(FIELD_BG, '')}
                className="absolute top-4 right-4 rounded-full border border-slate-200 bg-white/90 p-2.5 text-slate-900 shadow-lg backdrop-blur-md transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-95 dark:border-white/10 dark:bg-black/50 dark:text-white dark:hover:border-red-500/50 dark:hover:bg-red-500/20"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-slate-200/50 bg-slate-50/50 p-6 shadow-sm dark:border-white/5 dark:bg-white/2">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-[15px] leading-none font-black text-slate-900 dark:text-white">Avatar</h4>
                <p className="mt-1.5 text-[12px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Image • Max 2MB
                </p>
              </div>
            </div>
            <div className="focus-within:border-primary-500/50 group relative flex overflow-hidden rounded-[16px] border border-slate-200/80 bg-white shadow-sm transition-all dark:border-white/10 dark:bg-[#0b0f19]">
              <input
                type="file"
                ref={picInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) applyFile(file, FIELD_AVATAR, (url) => updateMeta({ avatarImageUrl: url }))
                }}
              />
              <button
                type="button"
                onClick={() => picInputRef.current?.click()}
                className="flex cursor-pointer items-center gap-2 border-r border-slate-200/80 bg-slate-50 px-5 py-4 text-[13px] font-bold whitespace-nowrap text-slate-900 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800/50 dark:text-white dark:hover:bg-slate-800"
              >
                <Upload className="h-4 w-4" /> Browse
              </button>
              <span className="flex w-full items-center truncate px-5 py-4 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                {profilePicUrl ? fileLabelFromUrl(profilePicUrl) : 'Select image'}
              </span>
            </div>
          </div>
          <div className="group relative flex h-[300px] items-center justify-center overflow-hidden rounded-[24px] border border-slate-200/50 bg-slate-50/50 shadow-sm dark:border-white/5 dark:bg-white/2">
            {profilePicUrl ? (
              isVideoUrl(profilePicUrl) ? (
                <video src={profilePicUrl} autoPlay loop muted playsInline className="h-full w-full object-cover" />
              ) : (
                <Image
                  src={profilePicUrl}
                  alt="Profile avatar"
                  className="h-full w-full object-cover"
                  width={400}
                  height={400}
                />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-50/50 dark:bg-white/2">
                <Image
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80"
                  alt="Placeholder"
                  className="h-full w-full object-cover opacity-[0.05] grayscale transition-all duration-500 group-hover:opacity-10"
                  width={400}
                  height={400}
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <p className="rounded-full bg-white/50 px-4 py-2 text-sm font-bold tracking-widest text-slate-900/40 uppercase backdrop-blur-md dark:bg-black/50 dark:text-white/30">
                    Preview
                  </p>
                </div>
              </div>
            )}
            {profilePicUrl && (
              <button
                type="button"
                onClick={() => {
                  setCustomValue(FIELD_AVATAR, '')
                  updateMeta({ avatarImageUrl: '' })
                }}
                className="absolute top-4 right-4 rounded-full border border-slate-200 bg-white/90 p-2.5 text-slate-900 shadow-lg backdrop-blur-md transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-95 dark:border-white/10 dark:bg-black/50 dark:text-white dark:hover:border-red-500/50 dark:hover:bg-red-500/20"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-slate-200/50 bg-slate-50/50 p-6 shadow-sm dark:border-white/5 dark:bg-white/2">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-purple-100 bg-purple-50 dark:border-purple-500/20 dark:bg-purple-500/10">
                <Film className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="text-[15px] leading-none font-black text-slate-900 dark:text-white">Explainer Video</h4>
                <p className="mt-1.5 text-[12px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Video • Max 15MB
                </p>
              </div>
            </div>
            <div className="focus-within:border-primary-500/50 group relative flex overflow-hidden rounded-[16px] border border-slate-200/80 bg-white shadow-sm transition-all dark:border-white/10 dark:bg-[#0b0f19]">
              <input
                type="file"
                ref={explainerInputRef}
                className="hidden"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) applyFile(file, FIELD_INTRO)
                }}
              />
              <button
                type="button"
                onClick={() => explainerInputRef.current?.click()}
                className="flex cursor-pointer items-center gap-2 border-r border-slate-200/80 bg-slate-50 px-5 py-4 text-[13px] font-bold whitespace-nowrap text-slate-900 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800/50 dark:text-white dark:hover:bg-slate-800"
              >
                <Upload className="h-4 w-4" /> Browse
              </button>
              <span className="flex w-full items-center truncate px-5 py-4 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                {explainerUrl ? fileLabelFromUrl(explainerUrl) : 'Select video'}
              </span>
            </div>
            {explainerUrl && (
              <div className="mt-5 flex items-center justify-between rounded-[16px] border border-emerald-100 bg-emerald-50 px-5 py-4 text-[13px] font-bold text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4" /> Ready
                </div>
                <button
                  type="button"
                  onClick={() => setCustomValue(FIELD_INTRO, '')}
                  className="rounded-full bg-emerald-100/50 p-1.5 text-emerald-600/70 hover:text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400/70 dark:hover:text-emerald-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-slate-200/50 bg-slate-50/50 p-6 shadow-sm dark:border-white/5 dark:bg-white/2">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-rose-100 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10">
                <LinkIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h4 className="text-[15px] leading-none font-black text-slate-900 dark:text-white">External Link</h4>
                <p className="mt-1.5 text-[12px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Youtube / Vimeo
                </p>
              </div>
            </div>
            <div className="focus-within:border-primary-500/50 focus-within:ring-primary-500/50 group flex overflow-hidden rounded-[16px] border border-slate-200/80 bg-white shadow-sm transition-all focus-within:ring-1 dark:border-white/10 dark:bg-[#0b0f19]">
              <span className="flex items-center justify-center border-r border-slate-200/80 bg-slate-50 px-5 py-4 text-[12px] font-bold tracking-wider text-slate-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400">
                URL
              </span>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => updateData('personal.explainerVideoUrl', e.target.value)}
                placeholder="https://"
                className="w-full bg-transparent px-5 py-4 text-[13px] font-medium text-slate-900 transition-colors outline-none placeholder:text-slate-500 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
