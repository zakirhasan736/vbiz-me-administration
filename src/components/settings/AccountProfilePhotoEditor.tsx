'use client'

import { Button } from '@/components/ui'
import { useAppDispatch } from '@/hooks/redux'
import { useOwnerMode } from '@/hooks/useOwnerMode'
import { resolveAccountHeaderAvatarUrl } from '@/lib/accountHeaderAvatar'
import { MediaUploadError, uploadMediaWithProgress } from '@/lib/media/uploadMediaWithProgress'
import { isUsableImageSrc } from '@/lib/mediaUrl'
import { notify } from '@/lib/toast/toast'
import { useUpdateProfileMutation } from '@/redux/features/auth/auth.api'
import { updateUser } from '@/redux/features/auth/user.slice'
import { useGetProfilesQuery } from '@/redux/features/profiles/profiles.api'
import { User } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

type Props = {
  displayName: string
  email: string | null
  accountAvatar: string | null
  disabled?: boolean
}

export function AccountProfilePhotoEditor({ displayName, email, accountAvatar, disabled }: Props) {
  const dispatch = useAppDispatch()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { ownerMode, isCorporateBackOffice } = useOwnerMode()
  const canUseCardFallback = ownerMode === 'single'
  const { data: profilesResult } = useGetProfilesQuery({ limit: 50 }, { skip: !canUseCardFallback })
  const [updateProfile] = useUpdateProfileMutation()
  const [busy, setBusy] = useState(false)

  const previewSrc = useMemo(
    () => resolveAccountHeaderAvatarUrl(accountAvatar, canUseCardFallback ? profilesResult?.items : null, ownerMode),
    [accountAvatar, canUseCardFallback, ownerMode, profilesResult?.items]
  )

  const hint = isCorporateBackOffice
    ? 'This photo is only for your corporate backoffice. It does not change any vCard.'
    : 'This photo is for your backoffice. If you have not uploaded one, your vCard avatar is shown.'

  const persistAvatar = async (url: string | null) => {
    const res = await updateProfile({ avatar: url }).unwrap()
    const next = res?.data?.user?.avatar ?? url
    dispatch(updateUser({ avatar: next }))
  }

  const handleUpload = async (file: File | undefined) => {
    if (!file || disabled || busy) return
    if (!file.type.startsWith('image/')) {
      notify.error('Choose a still image for your backoffice profile photo.')
      return
    }
    setBusy(true)
    try {
      const uploaded = await uploadMediaWithProgress({ file })
      if (!isUsableImageSrc(uploaded.url)) {
        throw new MediaUploadError('That file did not produce a usable image URL.')
      }
      await persistAvatar(uploaded.url)
      notify.success('Backoffice profile photo updated.')
    } catch (error) {
      const message =
        error instanceof MediaUploadError
          ? error.message
          : (error as { data?: { message?: string } })?.data?.message ||
            (error as Error)?.message ||
            'Could not update the backoffice profile photo.'
      notify.error(message)
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    if (disabled || busy) return
    if (!accountAvatar?.trim()) {
      notify.info(
        isCorporateBackOffice
          ? 'No corporate backoffice photo is saved yet.'
          : 'No backoffice photo is saved yet. The vCard avatar is only a fallback.'
      )
      return
    }
    setBusy(true)
    try {
      await persistAvatar(null)
      notify.success('Backoffice profile photo removed.')
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        (error as Error)?.message ||
        'Could not remove the backoffice profile photo.'
      notify.error(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col items-start gap-5 rounded-[20px] border border-slate-200/50 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:gap-6 sm:rounded-3xl sm:p-6 dark:border-white/5 dark:bg-white/2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled || busy}
        onChange={(event) => void handleUpload(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => fileInputRef.current?.click()}
        className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm disabled:cursor-not-allowed dark:border-white/10 dark:bg-[#0b0f19]"
        aria-label="Upload backoffice profile photo"
      >
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- account avatars are remote S3 / CDN URLs
          <img
            src={previewSrc}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <User className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
          <span className="text-[11px] font-bold tracking-wider text-white uppercase">
            {busy ? 'Saving' : 'Change'}
          </span>
        </div>
      </button>
      <div className="w-full min-w-0 sm:flex-1">
        <h4 className="mb-1 truncate text-lg leading-tight font-black tracking-tight text-slate-900 sm:text-[20px] dark:text-white">
          {displayName || 'User'}
        </h4>
        <p className="mb-2 truncate text-[13px] font-medium text-slate-500 sm:text-[14px] dark:text-slate-400">
          {email}
        </p>
        <p className="mb-4 text-[12px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">{hint}</p>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-10 px-4 font-bold sm:px-5"
            disabled={disabled || busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {busy ? 'Uploading…' : 'Upload new'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 px-4 font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 sm:px-5 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            disabled={disabled || busy}
            onClick={() => void handleRemove()}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  )
}
