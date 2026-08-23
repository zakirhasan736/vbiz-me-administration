'use client'

import { MediaFileUploader } from '@/components/media/MediaFileUploader'
import { MediaSourceActions } from '@/components/MediaSourceActions'
import { ReorderList } from '@/components/ReorderList'
import {
  ExpandableEntryBody,
  ExpandableEntryHeader,
  bottomAddButtonClass,
  expandableCardClassName,
} from '@/components/vcard/ExpandableEntryChrome'
import { VCardDateInput } from '@/components/vcard/VCardDateInput'
import { useExpandableEntryList } from '@/hooks/useExpandableEntryList'
import {
  createDefaultSectionPostItem,
  normalizeSectionPostList,
  type VCardSectionSchema,
} from '@/lib/vcardSectionSchemas'
import type { VCardSectionPostItem } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { Calendar, FileBox, FileText, Layers, Link as LinkIcon, MapPin, Plus, Star } from 'lucide-react'

type Accent = 'amber' | 'teal' | 'violet'

const accentStyles: Record<
  Accent,
  {
    headerBorder: string
    headerBg: string
    iconBorder: string
    iconBg: string
    iconText: string
    titleText: string
    btnBg: string
    focus: string
    badgeBorder: string
    badgeBg: string
    badgeText: string
    fileFocus: string
    chevronOpen: string
    cardExpandedBorder: string
    bottomAddText: string
  }
> = {
  amber: {
    headerBorder: 'border-amber-100 dark:border-amber-500/10',
    headerBg: 'bg-amber-50/50 dark:bg-amber-500/2',
    iconBorder: 'border-amber-100 dark:border-amber-500/20',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconText: 'text-amber-600 dark:text-amber-400',
    titleText: 'text-amber-600 dark:text-amber-400',
    btnBg: 'bg-amber-600 hover:bg-amber-700',
    focus: 'focus:border-amber-500 focus:ring-amber-500',
    badgeBorder: 'border-amber-100 dark:border-amber-500/20',
    badgeBg: 'bg-amber-50 dark:bg-amber-500/10',
    badgeText: 'text-amber-600 dark:text-amber-400',
    fileFocus: 'focus-within:border-amber-500 focus-within:ring-amber-500',
    chevronOpen: 'text-amber-500',
    cardExpandedBorder: 'border-amber-200/60 dark:border-amber-500/20',
    bottomAddText: 'text-amber-600 hover:border-amber-500/30 dark:text-amber-400',
  },
  teal: {
    headerBorder: 'border-teal-100 dark:border-teal-500/10',
    headerBg: 'bg-teal-50/50 dark:bg-teal-500/2',
    iconBorder: 'border-teal-100 dark:border-teal-500/20',
    iconBg: 'bg-teal-50 dark:bg-teal-500/10',
    iconText: 'text-teal-600 dark:text-teal-400',
    titleText: 'text-teal-600 dark:text-teal-400',
    btnBg: 'bg-teal-600 hover:bg-teal-700',
    focus: 'focus:border-teal-500 focus:ring-teal-500',
    badgeBorder: 'border-teal-100 dark:border-teal-500/20',
    badgeBg: 'bg-teal-50 dark:bg-teal-500/10',
    badgeText: 'text-teal-600 dark:text-teal-400',
    fileFocus: 'focus-within:border-teal-500 focus-within:ring-teal-500',
    chevronOpen: 'text-teal-500',
    cardExpandedBorder: 'border-teal-200/60 dark:border-teal-500/20',
    bottomAddText: 'text-teal-600 hover:border-teal-500/30 dark:text-teal-400',
  },
  violet: {
    headerBorder: 'border-violet-100 dark:border-violet-500/10',
    headerBg: 'bg-violet-50/50 dark:bg-violet-500/2',
    iconBorder: 'border-violet-100 dark:border-violet-500/20',
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
    iconText: 'text-violet-600 dark:text-violet-400',
    titleText: 'text-violet-600 dark:text-violet-400',
    btnBg: 'bg-violet-600 hover:bg-violet-700',
    focus: 'focus:border-violet-500 focus:ring-violet-500',
    badgeBorder: 'border-violet-100 dark:border-violet-500/20',
    badgeBg: 'bg-violet-50 dark:bg-violet-500/10',
    badgeText: 'text-violet-600 dark:text-violet-400',
    fileFocus: 'focus-within:border-violet-500 focus-within:ring-violet-500',
    chevronOpen: 'text-violet-500',
    cardExpandedBorder: 'border-violet-200/60 dark:border-violet-500/20',
    bottomAddText: 'text-violet-600 hover:border-violet-500/30 dark:text-violet-400',
  },
}

function resolveAccent(hint?: string): Accent {
  if (hint === 'teal' || hint === 'violet' || hint === 'amber') return hint
  return 'amber'
}

const baseInput =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:ring-1 shadow-sm'

type SectionPostsEditorPanelProps = {
  schema: VCardSectionSchema
  posts: VCardSectionPostItem[]
  onPostsChange: (next: VCardSectionPostItem[]) => void
  cardId?: string | null
}

export function SectionPostsEditorPanel({
  schema,
  posts: rawPosts,
  onPostsChange,
  cardId,
}: SectionPostsEditorPanelProps) {
  const posts = normalizeSectionPostList(rawPosts)
  const a = accentStyles[resolveAccent(schema.accentClass)]
  const inputClasses = `${baseInput} ${a.focus}`
  const fieldSet = new Set(schema.fields)
  const uploaderAccent =
    resolveAccent(schema.accentClass) === 'teal'
      ? 'teal'
      : resolveAccent(schema.accentClass) === 'violet'
        ? 'violet'
        : 'primary'
  const cardAccent = {
    border: a.badgeBorder,
    bg: a.badgeBg,
    text: a.badgeText,
    chevronOpen: a.chevronOpen,
    cardExpandedBorder: a.cardExpandedBorder,
  }

  const { isExpanded, toggleExpanded, expandNew, recoverExpandedAfterRemove, setCardRef } =
    useExpandableEntryList(posts)

  const setPosts = (next: VCardSectionPostItem[]) => onPostsChange(next)

  const addPost = () => {
    const next = createDefaultSectionPostItem()
    setPosts([...posts, next])
    expandNew(next.id)
  }

  const removePost = (id: string) => {
    const next = posts.filter((p) => p.id !== id)
    setPosts(next)
    recoverExpandedAfterRemove(id, next)
  }

  const updatePost = (
    id: string,
    field: keyof VCardSectionPostItem,
    value: VCardSectionPostItem[keyof VCardSectionPostItem]
  ) => {
    setPosts(posts.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col pb-12 duration-500">
      <div className={`mb-8 rounded-3xl border p-6 ${a.headerBorder} ${a.headerBg}`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-[14px] border ${a.iconBorder} ${a.iconBg}`}
            >
              <Layers className={`h-5 w-5 ${a.iconText}`} />
            </div>
            <h3 className={`text-lg font-black ${a.titleText}`}>{schema.title}</h3>
          </div>
          <button
            type="button"
            onClick={addPost}
            className={`hidden items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all active:scale-95 sm:flex ${a.btnBg}`}
          >
            <Plus className="h-4 w-4" /> {schema.addLabel}
          </button>
        </div>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          {schema.description}
        </p>
        <button
          type="button"
          onClick={addPost}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[13px] font-bold text-white shadow-sm transition-all active:scale-95 sm:hidden ${a.btnBg}`}
        >
          <Plus className="h-4 w-4" /> {schema.addLabel}
        </button>
      </div>

      <div className="flex flex-1 flex-col">
        {posts.length === 0 ? (
          <div className="rounded-4xl border border-slate-200/50 bg-slate-50/50 p-12 text-center shadow-sm dark:border-white/5 dark:bg-white/2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-slate-200 bg-slate-100 dark:border-white/5 dark:bg-white/5">
              <FileBox className="h-8 w-8 text-slate-400" />
            </div>
            <h4 className="mb-2 text-[16px] font-black text-slate-900 dark:text-white">{schema.emptyTitle}</h4>
            <p className="mx-auto mb-6 max-w-md text-[13px] text-slate-500 dark:text-slate-400">{schema.emptyHint}</p>
            <button
              type="button"
              onClick={addPost}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all active:scale-95 ${a.btnBg}`}
            >
              <Plus className="h-4 w-4" /> {schema.addLabel}
            </button>
          </div>
        ) : (
          <div>
            <ReorderList
              items={posts}
              getKey={(post) => post.id}
              onReorder={setPosts}
              renderItem={(post, index) => {
                const open = isExpanded(post.id)
                return (
                  <section ref={(el) => setCardRef(post.id, el)} className={expandableCardClassName(open, cardAccent)}>
                    <ExpandableEntryHeader
                      indexLabel={index + 1}
                      title={post.title || 'New Item'}
                      subtitle={post.description || post.url || null}
                      isExpanded={open}
                      onToggle={() => toggleExpanded(post.id)}
                      showRemove
                      onRemove={() => removePost(post.id)}
                      accent={cardAccent}
                    />

                    <ExpandableEntryBody isExpanded={open} className="p-4 sm:p-8">
                      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                        {fieldSet.has('title') ? (
                          <div className="group flex flex-col space-y-1.5">
                            <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                              <FileText className={`h-3.5 w-3.5 ${a.iconText}`} /> Title
                            </label>
                            <input
                              type="text"
                              value={post.title}
                              onChange={(e) => updatePost(post.id, 'title', e.target.value)}
                              placeholder="Enter title"
                              className={inputClasses}
                            />
                          </div>
                        ) : null}
                        {fieldSet.has('url') ? (
                          <div className="group flex flex-col space-y-1.5">
                            <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                              <LinkIcon className={`h-3.5 w-3.5 ${a.iconText}`} /> URL
                            </label>
                            <input
                              type="url"
                              value={post.url}
                              onChange={(e) => updatePost(post.id, 'url', e.target.value)}
                              placeholder="https://example.com"
                              className={inputClasses}
                            />
                          </div>
                        ) : null}
                      </div>

                      {fieldSet.has('description') ? (
                        <div className="group mb-8 flex flex-col space-y-1.5">
                          <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                            Description
                          </label>
                          <textarea
                            value={post.description}
                            onChange={(e) => updatePost(post.id, 'description', e.target.value)}
                            placeholder="Write a description..."
                            rows={4}
                            className={`min-h-25 w-full resize-y rounded-2xl border border-slate-200/80 bg-white px-5 py-4 text-[13px] font-medium text-slate-900 shadow-sm focus:ring-1 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white ${a.focus}`}
                          />
                        </div>
                      ) : null}

                      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                        {fieldSet.has('featuredImage') ? (
                          <div className="space-y-3">
                            <MediaFileUploader
                              label="Featured media"
                              accent={uploaderAccent}
                              profileId={cardId}
                              attachmentType={schema.title}
                              value={post.featuredImage}
                              accept="image/*,video/*,application/pdf"
                              hint="Upload an image, video, or PDF - preview appears here"
                              onChange={(next) => updatePost(post.id, 'featuredImage', next?.url || '')}
                            />
                            <MediaSourceActions
                              mode="both"
                              compact
                              profileId={cardId}
                              onSelect={(asset) => updatePost(post.id, 'featuredImage', asset.url)}
                            />
                          </div>
                        ) : null}
                        {fieldSet.has('date') ? (
                          <div className="group flex flex-col space-y-1.5">
                            <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                              <Calendar className={`h-3.5 w-3.5 ${a.iconText}`} /> Date
                            </label>
                            <VCardDateInput
                              value={post.date}
                              onChange={(e) => updatePost(post.id, 'date', e.target.value)}
                              className={inputClasses}
                            />
                          </div>
                        ) : null}
                        {fieldSet.has('rating') ? (
                          <div className="group flex flex-col space-y-1.5">
                            <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                              <Star className={`h-3.5 w-3.5 ${a.iconText}`} /> Rating
                            </label>
                            <input
                              type="text"
                              value={post.rating}
                              onChange={(e) => updatePost(post.id, 'rating', e.target.value)}
                              placeholder="e.g. 5"
                              className={inputClasses}
                            />
                          </div>
                        ) : null}
                        {fieldSet.has('location') ? (
                          <div className="group flex flex-col space-y-1.5">
                            <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                              <MapPin className={`h-3.5 w-3.5 ${a.iconText}`} /> Location
                            </label>
                            <input
                              type="text"
                              value={post.location}
                              onChange={(e) => updatePost(post.id, 'location', e.target.value)}
                              placeholder="City, venue, or address"
                              className={inputClasses}
                            />
                          </div>
                        ) : null}
                      </div>

                      {fieldSet.has('active') ? (
                        <div className="flex items-center gap-4">
                          <label className="group flex cursor-pointer items-center gap-3">
                            <div className="relative flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={post.active}
                                onChange={(e) => updatePost(post.id, 'active', e.target.checked)}
                                className="sr-only"
                              />
                              <div
                                className={`relative h-5.5 w-9.5 rounded-xl shadow-inner transition-colors ${
                                  post.active ? 'bg-green-500' : 'bg-slate-200 dark:bg-white/10'
                                }`}
                              >
                                <div
                                  className={`absolute top-0.75 left-0.75 h-4 w-4 rounded-[10px] bg-white shadow transition-transform ${
                                    post.active ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </div>
                            </div>
                            <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400">Active</span>
                          </label>
                        </div>
                      ) : null}
                    </ExpandableEntryBody>
                  </section>
                )
              }}
            />

            <div className="mt-8 flex flex-col items-center gap-4 pt-6">
              <button type="button" onClick={addPost} className={cn(bottomAddButtonClass, a.bottomAddText)}>
                <Plus className="h-4 w-4" /> {schema.addLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
