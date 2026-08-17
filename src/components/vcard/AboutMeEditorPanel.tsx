'use client'

import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { MediaFileUploader } from '@/components/media/MediaFileUploader'
import { MediaSourceActions } from '@/components/MediaSourceActions'
import { useAppDispatch } from '@/hooks/redux'
import {
  getAboutMeDraft,
  resetAboutMeDraft,
  setAboutMeDraft,
  subscribeAboutMeDraft,
  type AboutMeDraft,
} from '@/lib/aboutMeDraft'
import { flushAboutMeUpsert, scheduleAboutMeUpsert } from '@/lib/aboutMePersist'
import { TAB_REGISTRY } from '@/lib/tabRegistry'
import { useVCard } from '@/lib/VCardContext'
import { isLocalTempId } from '@/redux/features/profiles/profiles.api'
import { useGetProfileAboutMeQuery } from '@/redux/features/sections/aboutMe.api'
import { AlignLeft, FileBox, Type } from 'lucide-react'
import { useEffect, useRef, useSyncExternalStore } from 'react'

const inputClasses =
  'w-full rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0b0f19] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 shadow-sm'

type AboutMeEditorPanelProps = {
  cardId?: string | null
}

export function AboutMeEditorPanel({ cardId }: AboutMeEditorPanelProps) {
  const dispatch = useAppDispatch()
  const { vCardData } = useVCard()
  const draft = useSyncExternalStore(subscribeAboutMeDraft, getAboutMeDraft, getAboutMeDraft)
  const hydratedForId = useRef<string | null>(null)

  const profileId = cardId && !isLocalTempId(cardId) ? cardId : undefined
  const { data, isSuccess, isFetching, isError } = useGetProfileAboutMeQuery(profileId!, {
    skip: !profileId,
  })

  useEffect(() => {
    hydratedForId.current = null
  }, [cardId])

  useEffect(() => {
    if (!profileId || isFetching) return
    if (hydratedForId.current === profileId) return
    if (isSuccess && data) {
      hydratedForId.current = profileId
      setAboutMeDraft({
        title: data.title || '',
        descriptionHtml: data.description || '',
        featuredMediaUrl: data.featuredMediaUrl || '',
      })
      return
    }
    if (!isSuccess && !isError) return
    hydratedForId.current = profileId
    const about = vCardData.personal?.about?.trim() || ''
    if (about) {
      setAboutMeDraft({
        title: '',
        descriptionHtml: about,
        featuredMediaUrl: '',
      })
    } else {
      resetAboutMeDraft()
    }
  }, [profileId, data, isSuccess, isFetching, isError, vCardData.personal?.about])

  useEffect(() => {
    return () => {
      void flushAboutMeUpsert(dispatch)
    }
  }, [dispatch, profileId])

  const update = (partial: Partial<AboutMeDraft>) => {
    setAboutMeDraft(partial)
    if (profileId) scheduleAboutMeUpsert(dispatch, profileId)
  }

  const tabLabel = TAB_REGISTRY.about_me.label

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col space-y-6 pb-12 duration-500">
      <div className="rounded-3xl border border-violet-100 bg-violet-50/50 p-6 dark:border-violet-500/10 dark:bg-violet-500/2">
        <h3 className="mb-2 text-lg font-black text-violet-600 dark:text-violet-400">{tabLabel}</h3>
        <p className="text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          The section is always labeled About Me on your public card. Your title is the headline under that, followed by
          the rich description, with featured media as the section background.
        </p>
      </div>

      <section className="overflow-hidden rounded-4xl border border-slate-200/50 bg-slate-50/50 shadow-sm dark:border-white/5 dark:bg-white/2">
        <div className="flex items-center gap-4 border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-violet-100 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/10">
            <Type className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <h4 className="text-[16px] font-black text-slate-900 dark:text-white">Title</h4>
        </div>
        <div className="p-4 sm:p-8">
          <label className="mb-1.5 block pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Title
          </label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Entrepreneur, Innovator and Out of the Box Thinker"
            className={inputClasses}
          />
          <p className="mt-2 pl-1 text-[12px] font-medium text-slate-500 dark:text-slate-400">
            Shown under About Me on your public card
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-4xl border border-slate-200/50 bg-slate-50/50 shadow-sm dark:border-white/5 dark:bg-white/2">
        <div className="flex items-center gap-4 border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-violet-100 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/10">
            <AlignLeft className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <h4 className="text-[16px] font-black text-slate-900 dark:text-white">Description</h4>
        </div>
        <div className="space-y-2 p-4 sm:p-8">
          <label className="mb-1.5 block pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Detailed description
          </label>
          <RichTextEditor
            value={draft.descriptionHtml}
            onChange={(html) => update({ descriptionHtml: html })}
            placeholder="Share your story, background, and what makes you unique…"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-4xl border border-slate-200/50 bg-slate-50/50 shadow-sm dark:border-white/5 dark:bg-white/2">
        <div className="flex items-center gap-4 border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-violet-100 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/10">
            <FileBox className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <h4 className="text-[16px] font-black text-slate-900 dark:text-white">Featured media</h4>
        </div>
        <div className="space-y-3 p-4 sm:p-8">
          <MediaFileUploader
            label="Featured media"
            accent="violet"
            profileId={cardId}
            attachmentType="About Me Featured"
            accept="image/*,video/*"
            allowUrlPaste={false}
            hint="Used as the About Me section background — upload an image or video"
            value={draft.featuredMediaUrl}
            onChange={(next) => update({ featuredMediaUrl: next?.url || '' })}
          />
          <MediaSourceActions
            mode="both"
            compact
            showVideoExtras={false}
            profileId={cardId}
            onSelect={(asset) => update({ featuredMediaUrl: asset.url })}
          />
        </div>
      </section>
    </div>
  )
}
