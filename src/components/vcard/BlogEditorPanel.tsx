'use client'

import { AiDropFillZone, type AiFilledResult } from '@/components/AiDropFillZone'
import { MediaFileUploader } from '@/components/media/MediaFileUploader'
import { MediaSourceActions } from '@/components/MediaSourceActions'
import { ReorderList } from '@/components/ReorderList'
import { SectionJumpPills } from '@/components/SectionJumpPills'
import {
  ExpandableEntryBody,
  ExpandableEntryHeader,
  bottomAddButtonClass,
  expandableCardClassName,
} from '@/components/vcard/ExpandableEntryChrome'
import { VCardDateInput } from '@/components/vcard/VCardDateInput'
import { useExpandableEntryList } from '@/hooks/useExpandableEntryList'
import { mapBlogsFromPayload } from '@/lib/ai/applyCardDraft'
import { createDefaultGeneralPost, normalizeGeneralPostList } from '@/lib/vcardGeneralPosts'
import type { VCardGeneralPost } from '@/types/vcard'
import { cn } from '@/utils/cn'
import { Calendar, FileBox, LayoutGrid, Plus } from 'lucide-react'
import { useEffect, useRef } from 'react'

const inputClasses =
  'w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b0f19] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
const selectClasses =
  'appearance-none w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b0f19] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none cursor-pointer focus:border-violet-500 focus:ring-1 focus:ring-violet-500'

const accent = {
  border: 'border-violet-100 dark:border-violet-500/20',
  bg: 'bg-violet-50 dark:bg-violet-500/10',
  text: 'text-violet-600 dark:text-violet-400',
  chevronOpen: 'text-violet-500',
  cardExpandedBorder: 'border-violet-200/60 dark:border-violet-500/20',
}

type BlogEditorPanelProps = {
  posts: VCardGeneralPost[] | null | undefined
  onPostsChange: (next: VCardGeneralPost[]) => void
  profileId?: string | null
}

export function BlogEditorPanel({ posts: rawPosts, onPostsChange, profileId }: BlogEditorPanelProps) {
  const posts = normalizeGeneralPostList(rawPosts)
  const postsRef = useRef(posts)
  const { isExpanded, toggleExpanded, expandNew, recoverExpandedAfterRemove, setCardRef, setExpandedId } =
    useExpandableEntryList(posts)

  useEffect(() => {
    postsRef.current = posts
  }, [posts])

  const setPosts = (next: VCardGeneralPost[]) => {
    onPostsChange(next)
  }

  const addPost = () => {
    const next = createDefaultGeneralPost()
    setPosts([...postsRef.current, next])
    expandNew(next.id)
  }

  const removePost = (id: string) => {
    const next = postsRef.current.filter((p) => p.id !== id)
    setPosts(next)
    recoverExpandedAfterRemove(id, next)
  }

  const updatePost = (id: string, field: keyof VCardGeneralPost, value: VCardGeneralPost[keyof VCardGeneralPost]) => {
    setPosts(postsRef.current.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const applyFilled = (result: AiFilledResult) => {
    const mapped = mapBlogsFromPayload(result.payload)
    if (!mapped.length) return
    setPosts([...mapped, ...postsRef.current.filter((p) => p.title || p.description)])
    expandNew(mapped[0]!.id)
  }

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col space-y-6 pb-12 duration-500">
      <div
        className="rounded-3xl border border-violet-100 bg-violet-50/50 p-6 dark:border-violet-500/10 dark:bg-violet-500/2"
        data-tour-id="tour-editor-panel-blog"
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-violet-600 dark:text-violet-400">News / Blogs</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Publish updates with a featured image or video per post.
            </p>
          </div>
          <button
            type="button"
            onClick={addPost}
            className="hidden items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all hover:bg-violet-700 active:scale-95 sm:flex"
          >
            <Plus className="h-4 w-4" /> Add post
          </button>
        </div>
        <button
          type="button"
          onClick={addPost}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-violet-700 active:scale-95 sm:hidden"
        >
          <Plus className="h-4 w-4" /> Add post
        </button>
      </div>

      <AiDropFillZone
        section="blogs"
        profileId={profileId}
        currentDraft={{ blogs: posts }}
        accent="violet"
        hint="Drop or paste posts — AI extracts title, summary, and category (OCR for images)"
        onFilled={applyFilled}
      />

      {posts.length > 0 ? (
        <SectionJumpPills
          accent="violet"
          label="Quick find"
          onJump={setExpandedId}
          items={posts.map((p) => ({
            id: p.id,
            title: p.title || 'Untitled',
            detail: p.description?.slice(0, 40),
          }))}
        />
      ) : null}

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/50 bg-slate-50/50 p-12 text-center shadow-sm dark:border-white/5 dark:bg-white/2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-slate-200 bg-slate-100 dark:border-white/5 dark:bg-white/5">
            <FileBox className="h-8 w-8 text-slate-400" />
          </div>
          <h4 className="mb-2 text-[16px] font-black text-slate-900 dark:text-white">No blog posts yet</h4>
          <p className="mx-auto mb-6 max-w-md text-[13px] text-slate-500 dark:text-slate-400">
            Click &quot;Add post&quot; to publish your first article on the profile Blog section.
          </p>
          <button
            type="button"
            onClick={addPost}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-violet-700 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add post
          </button>
        </div>
      ) : (
        <>
          <ReorderList
            items={posts}
            getKey={(p) => p.id}
            onReorder={setPosts}
            renderItem={(item, idx) => {
              const open = isExpanded(item.id)
              return (
                <section
                  id={`entry-${item.id}`}
                  ref={(el) => setCardRef(item.id, el)}
                  className={cn(expandableCardClassName(open, accent), 'scroll-mt-24')}
                >
                  <ExpandableEntryHeader
                    indexLabel={idx + 1}
                    title={item.title || 'New Post'}
                    subtitle={item.category || item.description?.slice(0, 48) || null}
                    isExpanded={open}
                    onToggle={() => toggleExpanded(item.id)}
                    showRemove
                    onRemove={() => removePost(item.id)}
                    accent={accent}
                  />

                  <ExpandableEntryBody isExpanded={open} className="space-y-4 p-5">
                    <div className="group flex flex-col space-y-1.5">
                      <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        <LayoutGrid className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" /> Category
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => updatePost(item.id, 'category', e.target.value)}
                        className={selectClasses}
                      >
                        <option value="" disabled>
                          Select category
                        </option>
                        <option value="News">News</option>
                        <option value="Announcement">Announcement</option>
                        <option value="Event">Event</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <input
                      value={item.title}
                      onChange={(e) => updatePost(item.id, 'title', e.target.value)}
                      placeholder="Headline"
                      className={`${inputClasses} font-semibold`}
                    />

                    <textarea
                      value={item.description}
                      onChange={(e) => updatePost(item.id, 'description', e.target.value)}
                      rows={3}
                      placeholder="Short summary…"
                      className={`${inputClasses} resize-none`}
                    />

                    <input
                      type="url"
                      value={item.customUrl}
                      onChange={(e) => updatePost(item.id, 'customUrl', e.target.value)}
                      placeholder="https://… (optional link)"
                      className={inputClasses}
                    />

                    <div className="space-y-3">
                      <MediaFileUploader
                        label="Featured image"
                        accent="violet"
                        profileId={profileId}
                        attachmentType="Blog Featured"
                        accept="image/*,video/*"
                        allowUrlPaste={false}
                        hint="Upload an image or video - preview appears below"
                        value={item.featuredImage}
                        onChange={(next) => updatePost(item.id, 'featuredImage', next?.url || '')}
                      />
                      <MediaSourceActions
                        mode="both"
                        compact
                        profileId={profileId}
                        onSelect={(asset) => updatePost(item.id, 'featuredImage', asset.url)}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
                      <div className="group flex flex-col space-y-1.5">
                        <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" /> Date
                        </label>
                        <VCardDateInput
                          value={item.date}
                          onChange={(e) => updatePost(item.id, 'date', e.target.value)}
                          className={inputClasses}
                        />
                      </div>
                      <div className="flex items-center gap-4 pb-1">
                        <label className="group flex cursor-pointer items-center gap-3">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={item.active}
                              onChange={(e) => updatePost(item.id, 'active', e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`relative h-5.5 w-9.5 rounded-xl shadow-inner transition-colors ${
                                item.active ? 'bg-green-500' : 'bg-slate-200 dark:bg-white/10'
                              }`}
                            >
                              <div
                                className={`absolute top-0.75 left-0.75 h-4 w-4 rounded-[10px] bg-white shadow transition-transform ${
                                  item.active ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </div>
                          </div>
                          <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400">Published</span>
                        </label>
                      </div>
                    </div>
                  </ExpandableEntryBody>
                </section>
              )
            }}
          />

          <div className="mt-8 flex flex-col items-center gap-4 pt-6">
            <button
              type="button"
              onClick={addPost}
              className={cn(bottomAddButtonClass, 'text-violet-600 hover:border-violet-500/30 dark:text-violet-400')}
            >
              <Plus className="h-4 w-4" /> Add Another Post
            </button>
          </div>
        </>
      )}
    </div>
  )
}
