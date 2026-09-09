'use client'

import { DocumentUploadArea, type UploadedDoc } from '@/components/DocumentUploadArea'
import { MediaSourceActions } from '@/components/MediaSourceActions'
import { ReorderList } from '@/components/ReorderList'
import { MediaUploadError, uploadMediaWithProgress } from '@/lib/media/uploadMediaWithProgress'
import { useVCard } from '@/lib/VCardContext'
import { useResolvedSectionTitle } from '@/profile-app/lib/sectionTitleContext'
import { cn } from '@/utils/cn'
import { GripVertical, Images, Loader2, Plus, Trash2, Video } from 'lucide-react'
import { useRef, useState } from 'react'

type GalleryItem = { id: string; url: string; name: string; type?: string; size?: number }
type VideoItem = { id: string; title: string; url: string }
type ContentMediaState = {
  gallery: GalleryItem[]
  videos: VideoItem[]
  note: string
}

export function TabContentMedia() {
  const sectionTitle = useResolvedSectionTitle(undefined, 'Content & media')
  const { vCardData, updateData, cardId } = useVCard()
  const cm: ContentMediaState = {
    gallery: [],
    videos: [],
    note: '',
    ...((vCardData as { contentMedia?: ContentMediaState }).contentMedia || {}),
  }
  const gallery = cm.gallery || []
  const videos = cm.videos || []
  const videoRef = useRef<HTMLInputElement>(null)
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoError, setVideoError] = useState('')

  const persist = (next: ContentMediaState) => updateData('contentMedia', next)

  const galleryDocs: UploadedDoc[] = gallery.map((g) => ({
    id: g.id,
    name: g.name,
    url: g.url,
    type: g.type || 'image/*',
    size: typeof g.size === 'number' ? g.size : 0,
  }))

  const ingestVideoFile = async (file: File) => {
    setVideoError('')
    if (!cardId) {
      setVideoError('Save the card first, then upload a video.')
      return
    }
    setVideoUploading(true)
    try {
      const result = await uploadMediaWithProgress({
        file,
        profileId: cardId,
        attachmentType: 'Content Media Video',
      })
      persist({
        ...cm,
        videos: [
          {
            id: `vid_${Date.now()}`,
            url: result.url,
            title: '',
          },
          ...videos,
        ],
      })
    } catch (err) {
      setVideoError(err instanceof MediaUploadError ? err.message : 'Upload failed. Please try again.')
    } finally {
      setVideoUploading(false)
    }
  }

  return (
    <div className="animate-in fade-in mx-auto w-full max-w-7xl space-y-6 pb-12 duration-500">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/15">
          <Images className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">{sectionTitle}</h2>
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
          profileId={cardId}
          attachmentType="Content Media Gallery"
          onChange={(files) =>
            persist({
              ...cm,
              gallery: files.map((f) => ({
                id: f.id,
                url: f.url,
                name: f.name,
                type: f.type,
                size: f.size,
              })),
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
          disabled={videoUploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            void ingestVideoFile(file)
          }}
        />
        <button
          type="button"
          disabled={videoUploading}
          onClick={() => videoRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-slate-200 py-6 text-center hover:border-violet-400/50 disabled:cursor-wait disabled:opacity-70 dark:border-white/15"
        >
          {videoUploading ? (
            <Loader2 className="mx-auto mb-1 h-6 w-6 animate-spin text-violet-500" />
          ) : (
            <Video className="mx-auto mb-1 h-6 w-6 text-violet-500" />
          )}
          <p className="text-sm font-bold">{videoUploading ? 'Uploading video…' : 'Upload or add video URL below'}</p>
        </button>
        {videoError ? <p className="text-xs font-semibold text-rose-500">{videoError}</p> : null}
        <MediaSourceActions
          mode="video"
          profileId={cardId}
          onSelect={(asset) =>
            persist({
              ...cm,
              videos: [{ id: `vid_${Date.now()}`, url: asset.url, title: '' }, ...videos],
            })
          }
        />

        <ReorderList
          items={videos}
          getKey={(v) => v.id}
          onReorder={(next) => persist({ ...cm, videos: next })}
          renderItem={(v, _index, dragHandleProps) => (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0b0f19]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    {...dragHandleProps}
                    className={cn(
                      'flex h-8 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5',
                      dragHandleProps.className
                    )}
                  >
                    <GripVertical className="h-4 w-4" aria-hidden />
                  </span>
                  <p
                    {...dragHandleProps}
                    className={cn(
                      'text-[11px] font-black tracking-wider text-slate-400 uppercase',
                      dragHandleProps.className
                    )}
                  >
                    Video
                  </p>
                </div>
                <button
                  type="button"
                  data-no-dnd
                  onClick={() => persist({ ...cm, videos: videos.filter((x) => x.id !== v.id) })}
                  className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
