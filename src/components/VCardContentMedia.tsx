'use client'

import { DocumentUploadArea, type UploadedDoc } from '@/components/DocumentUploadArea'
import { MediaSourceActions } from '@/components/MediaSourceActions'
import { ReorderList } from '@/components/ReorderList'
import { useVCard } from '@/lib/VCardContext'
import { Images, Plus, Trash2, Video } from 'lucide-react'
import { useRef } from 'react'

type GalleryItem = { id: string; url: string; name: string }
type VideoItem = { id: string; title: string; url: string }
type ContentMediaState = {
  gallery: GalleryItem[]
  videos: VideoItem[]
  note: string
}

export function TabContentMedia() {
  const { vCardData, updateData } = useVCard()
  const cm: ContentMediaState = {
    gallery: [],
    videos: [],
    note: '',
    ...((vCardData as { contentMedia?: ContentMediaState }).contentMedia || {}),
  }
  const gallery = cm.gallery || []
  const videos = cm.videos || []
  const videoRef = useRef<HTMLInputElement>(null)

  const persist = (next: ContentMediaState) => updateData('contentMedia', next)

  const galleryDocs: UploadedDoc[] = gallery.map((g) => ({
    id: g.id,
    name: g.name,
    url: g.url,
    type: 'image/*',
    size: 0,
  }))

  return (
    <div className="animate-in fade-in max-w-3xl space-y-6 pb-12 duration-500">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/15">
          <Images className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Content & media</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Gallery images and video links for your public card.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-[28px] border border-slate-200/60 bg-slate-50/40 p-6 dark:border-white/5 dark:bg-white/2">
        <DocumentUploadArea
          files={galleryDocs}
          accent="violet"
          label="Gallery images"
          hint="Drag & drop images — PNG, JPG, WEBP"
          mediaAssist="image"
          onChange={(files) =>
            persist({
              ...cm,
              gallery: files.map((f) => ({ id: f.id, url: f.url, name: f.name })),
            })
          }
        />
      </div>

      <div className="space-y-4 rounded-[28px] border border-slate-200/60 bg-slate-50/40 p-6 dark:border-white/5 dark:bg-white/2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-black tracking-wider text-slate-400 uppercase">Videos</p>
          <button
            type="button"
            onClick={() =>
              persist({
                ...cm,
                videos: [{ id: `vid_${Date.now()}`, url: '', title: '' }, ...videos],
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10"
          >
            <Plus className="h-3.5 w-3.5" /> Add video
          </button>
        </div>

        <input
          ref={videoRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            persist({
              ...cm,
              videos: [
                {
                  id: `vid_${Date.now()}`,
                  url: URL.createObjectURL(file),
                  title: file.name,
                },
                ...videos,
              ],
            })
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => videoRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-slate-200 py-6 text-center hover:border-violet-400/50 dark:border-white/15"
        >
          <Video className="mx-auto mb-1 h-6 w-6 text-violet-500" />
          <p className="text-sm font-bold">Upload or add video URL below</p>
        </button>
        <MediaSourceActions
          mode="video"
          onSelect={(asset) =>
            persist({
              ...cm,
              videos: [{ id: `vid_${Date.now()}`, url: asset.url, title: asset.name }, ...videos],
            })
          }
        />

        <ReorderList
          items={videos}
          getKey={(v) => v.id}
          onReorder={(next) => persist({ ...cm, videos: next })}
          renderItem={(v, _i, controls) => (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-black tracking-wider text-slate-400 uppercase">Video</p>
                <div className="flex items-center gap-1">
                  {controls}
                  <button
                    type="button"
                    onClick={() => persist({ ...cm, videos: videos.filter((x) => x.id !== v.id) })}
                    className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <input
                value={v.title}
                onChange={(e) =>
                  persist({
                    ...cm,
                    videos: videos.map((x) => (x.id === v.id ? { ...x, title: e.target.value } : x)),
                  })
                }
                placeholder="Title"
                className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm font-semibold dark:border-white/10"
              />
              <input
                value={v.url}
                onChange={(e) =>
                  persist({
                    ...cm,
                    videos: videos.map((x) => (x.id === v.id ? { ...x, url: e.target.value } : x)),
                  })
                }
                placeholder="https://youtube.com/… or uploaded file"
                className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm font-medium dark:border-white/10"
              />
            </div>
          )}
        />
      </div>

      <label className="block space-y-1.5">
        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Media note</span>
        <textarea
          rows={3}
          value={cm.note || ''}
          onChange={(e) => persist({ ...cm, note: e.target.value })}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium dark:border-white/10 dark:bg-[#0b0f19]"
          placeholder="Optional caption for your media section"
        />
      </label>
    </div>
  )
}
