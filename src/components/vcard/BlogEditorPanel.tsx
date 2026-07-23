'use client'

import { createDefaultGeneralPost, normalizeGeneralPostList } from '@/lib/vcardGeneralPosts'
import type { VCardGeneralPost } from '@/types/vcard'
import {
  Calendar,
  FileBox,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Link as LinkIcon,
  PenTool,
  Plus,
  Trash2,
} from 'lucide-react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm'
const selectClasses =
  'appearance-none bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 w-full text-[13px] font-medium text-slate-900 dark:text-white outline-none cursor-pointer focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-sm'

type BlogEditorPanelProps = {
  posts: VCardGeneralPost[] | null | undefined
  onPostsChange: (next: VCardGeneralPost[]) => void
}

export function BlogEditorPanel({ posts: rawPosts, onPostsChange }: BlogEditorPanelProps) {
  const posts = normalizeGeneralPostList(rawPosts)

  const setPosts = (next: VCardGeneralPost[]) => {
    onPostsChange(next)
  }

  const addPost = () => {
    setPosts([createDefaultGeneralPost(), ...posts])
  }

  const removePost = (id: string) => {
    setPosts(posts.filter((p) => p.id !== id))
  }

  const updatePost = (id: string, field: keyof VCardGeneralPost, value: VCardGeneralPost[keyof VCardGeneralPost]) => {
    setPosts(posts.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col pb-12 duration-500">
      <div
        className="mb-8 rounded-[24px] border border-amber-100 bg-amber-50/50 p-6 dark:border-amber-500/10 dark:bg-amber-500/2"
        data-tour-id="tour-editor-panel-blog"
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-amber-100 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10">
              <PenTool className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-black text-amber-600 dark:text-amber-400">Blog</h3>
          </div>
          <button
            type="button"
            onClick={addPost}
            className="hidden items-center justify-center gap-2 rounded-[12px] bg-amber-600 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all hover:bg-amber-700 active:scale-95 sm:flex"
          >
            <Plus className="h-4 w-4" /> Add Post
          </button>
        </div>
        <p className="mb-0 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Articles and updates for the Blog tab on your public profile (v1 and v2). Toggle visibility under Card
          Settings → Blog. Changes appear instantly in live preview.
        </p>
        <button
          type="button"
          onClick={addPost}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[12px] bg-amber-600 px-5 py-3.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-amber-700 active:scale-95 sm:hidden"
        >
          <Plus className="h-4 w-4" /> Add Post
        </button>
      </div>

      <div className="flex flex-1 flex-col">
        {posts.length === 0 ? (
          <div className="rounded-[32px] border border-slate-200/50 bg-slate-50/50 p-12 text-center shadow-sm dark:border-white/5 dark:bg-white/2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-slate-200 bg-slate-100 dark:border-white/5 dark:bg-white/5">
              <FileBox className="h-8 w-8 text-slate-400" />
            </div>
            <h4 className="mb-2 text-[16px] font-black text-slate-900 dark:text-white">No blog posts yet</h4>
            <p className="mx-auto mb-6 max-w-md text-[13px] text-slate-500 dark:text-slate-400">
              Click &quot;Add Post&quot; to publish your first article on the profile Blog section.
            </p>
            <button
              type="button"
              onClick={addPost}
              className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-amber-700 active:scale-95"
            >
              <Plus className="h-4 w-4" /> Add Post
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post, index) => (
              <section
                key={post.id}
                className="group/card overflow-hidden rounded-[32px] border border-slate-200/50 bg-slate-50/50 shadow-sm transition-all hover:border-slate-200/80 hover:bg-slate-50 dark:border-white/5 dark:bg-white/2"
              >
                <div className="flex items-center justify-between border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-amber-100 bg-amber-50 font-black text-amber-600 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                      {posts.length - index}
                    </div>
                    <h4 className="text-[16px] font-black text-slate-900 dark:text-white">
                      {post.title || 'New Post'}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePost(post.id)}
                    className="flex items-center gap-2 rounded-[12px] bg-red-50 px-4 py-2.5 font-bold text-red-500 opacity-0 transition-all group-hover/card:opacity-100 hover:bg-red-100 hover:text-red-600 focus:opacity-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                    title="Remove Post"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>

                <div className="p-4 sm:p-8">
                  <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="group flex flex-col space-y-1.5">
                      <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        <LayoutGrid className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Category
                      </label>
                      <select
                        value={post.category}
                        onChange={(e) => updatePost(post.id, 'category', e.target.value)}
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
                    <div className="group flex flex-col space-y-1.5">
                      <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Title
                      </label>
                      <input
                        type="text"
                        value={post.title}
                        onChange={(e) => updatePost(post.id, 'title', e.target.value)}
                        placeholder="Enter post title"
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div className="group mb-8 flex flex-col space-y-1.5">
                    <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                      Post Description
                    </label>
                    <textarea
                      value={post.description}
                      onChange={(e) => updatePost(post.id, 'description', e.target.value)}
                      placeholder="Write your post description here..."
                      rows={5}
                      className="min-h-[120px] w-full resize-y rounded-[16px] border border-slate-200/80 bg-white px-5 py-4 text-[13px] font-medium text-slate-900 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white"
                    />
                  </div>

                  <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="group flex flex-col space-y-1.5">
                      <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        <LinkIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Custom URL
                      </label>
                      <input
                        type="url"
                        value={post.customUrl}
                        onChange={(e) => updatePost(post.id, 'customUrl', e.target.value)}
                        placeholder="https://example.com/article"
                        className={inputClasses}
                      />
                    </div>
                    <div className="group flex flex-col space-y-1.5">
                      <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        <ImageIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Featured Image URL
                      </label>
                      <input
                        type="url"
                        value={post.featuredImage}
                        onChange={(e) => updatePost(post.id, 'featuredImage', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="group flex flex-col space-y-1.5">
                      <label className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Date
                      </label>
                      <input
                        type="date"
                        value={post.date}
                        onChange={(e) => updatePost(post.id, 'date', e.target.value)}
                        className={`${inputClasses} [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:dark:invert`}
                      />
                    </div>
                    <div className="flex items-center gap-4 pt-6">
                      <label className="group flex cursor-pointer items-center gap-3">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={post.active}
                            onChange={(e) => updatePost(post.id, 'active', e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`relative h-[22px] w-[38px] rounded-[12px] shadow-inner transition-colors ${
                              post.active ? 'bg-green-500' : 'bg-slate-200 dark:bg-white/10'
                            }`}
                          >
                            <div
                              className={`absolute top-[3px] left-[3px] h-4 w-4 rounded-[10px] bg-white shadow transition-transform ${
                                post.active ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </div>
                        </div>
                        <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400">Published</span>
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            ))}

            <div className="mt-8 flex justify-center border-t border-slate-200/50 pt-8 dark:border-white/5">
              <button
                type="button"
                onClick={addPost}
                className="flex items-center justify-center gap-2 rounded-[16px] border border-slate-200/80 bg-white px-6 py-4 text-[13px] font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-300 dark:hover:bg-white/5"
              >
                <Plus className="h-4 w-4" /> Add Post
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
