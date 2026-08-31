'use client'

import { DocumentUploadArea, type UploadedDoc } from '@/components/DocumentUploadArea'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { MediaFileUploader } from '@/components/media/MediaFileUploader'
import { MediaSourceActions } from '@/components/MediaSourceActions'
import { SlugAvailabilityField } from '@/components/vcard/SlugAvailabilityField'
import { VCardDateInput } from '@/components/vcard/VCardDateInput'
import { VCardMediaField } from '@/components/vcard/VCardMediaField'
import { useAppDispatch } from '@/hooks/redux'
import { usePackageAccess } from '@/hooks/usePackageAccess'
import { getAboutMeDraft, isAboutMeDescriptionFilled, setAboutMeDraft } from '@/lib/aboutMeDraft'
import { flushAboutMeUpsert, scheduleAboutMeUpsert } from '@/lib/aboutMePersist'
import { displayMediaAccess } from '@/lib/packageAccess'
import { useVCardDisplayEditor } from '@/lib/useVCardDisplayEditor'
import type { CompletionFieldEdit, CompletionScalarControl, VCardCompletionField } from '@/lib/vcardCompletion'
import { useVCard } from '@/lib/VCardContext'
import { createDefaultEducationEntry } from '@/lib/vcardEducation'
import { createDefaultExperienceEntry } from '@/lib/vcardExperience'
import { createDefaultFaqEntry } from '@/lib/vcardFaq'
import { createDefaultGeneralPost } from '@/lib/vcardGeneralPosts'
import { createDefaultPortfolioEntry } from '@/lib/vcardPortfolio'
import { createDefaultReviewEntry } from '@/lib/vcardReviews'
import { createDefaultSectionPostItem } from '@/lib/vcardSectionSchemas'
import { createDefaultServiceEntry } from '@/lib/vcardServices'
import { createDefaultSkillGroup } from '@/lib/vcardSkills'
import { createDefaultVCardSocial } from '@/lib/vcardSocial'
import { isLocalTempId } from '@/redux/features/profiles/profiles.api'
import type { VCardCustomTabItem, VCardData, VCardExtraField, VCardSectionPostItem } from '@/types/vcard'
import { Check, Image as ImageIcon, Link2, Plus, Upload } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-4 py-3.5 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm'

const aboutMeInputClasses =
  'w-full rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0b0f19] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 shadow-sm'

const selectClasses = `${inputClasses} appearance-none cursor-pointer`

const applyButtonClasses =
  'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-3.5 text-xs font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40'

function FieldLabel({ children }: { children: string }) {
  return (
    <label className="pl-0.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
      {children}
    </label>
  )
}

function isMultilineControl(control: CompletionScalarControl) {
  return control === 'textarea' || control === 'color'
}

function DeferredApplyRow({
  label,
  stacked,
  canApply,
  onApply,
  children,
}: {
  label?: string
  stacked?: boolean
  canApply: boolean
  onApply: () => void
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <div className={stacked ? 'space-y-3' : 'flex items-start gap-2'}>
        <div className="min-w-0 flex-1">{children}</div>
        <button type="button" onClick={onApply} disabled={!canApply} className={applyButtonClasses}>
          <Check className="h-3.5 w-3.5" />
          Apply
        </button>
      </div>
    </div>
  )
}

function DeferredScalarField({
  label,
  control,
  initialValue,
  options,
  cardId,
  isCreateMode,
  onApply,
}: {
  label: string
  control: CompletionScalarControl
  initialValue: string
  options?: { value: string; label: string }[]
  cardId?: string | null
  isCreateMode?: boolean
  onApply: (value: string) => void
}) {
  const [draft, setDraft] = useState(initialValue)
  const trimmed = draft.trim()
  const canApply = Boolean(trimmed) && trimmed !== initialValue.trim()

  return (
    <DeferredApplyRow
      label={label}
      stacked={isMultilineControl(control)}
      canApply={canApply}
      onApply={() => onApply(draft)}
    >
      <ScalarControl
        control={control}
        value={draft}
        onChange={setDraft}
        options={options}
        label={label}
        cardId={cardId}
        isCreateMode={isCreateMode}
      />
    </DeferredApplyRow>
  )
}

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'twitter', label: 'Twitter / X' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'website', label: 'Website' },
  { key: 'custom', label: 'Custom link' },
] as const

function getPathValue(data: VCardData, path: string): string {
  const parts = path.split('.')
  let cur: unknown = data
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return ''
    cur = (cur as Record<string, unknown>)[part]
  }
  return cur == null ? '' : String(cur)
}

function ScalarControl({
  control,
  value,
  onChange,
  options,
  label,
  cardId,
  isCreateMode,
}: {
  control: CompletionScalarControl
  value: string
  onChange: (next: string) => void
  options?: { value: string; label: string }[]
  label?: string
  cardId?: string | null
  isCreateMode?: boolean
}) {
  if (control === 'slug') {
    return (
      <SlugAvailabilityField
        value={value}
        onChange={onChange}
        excludeId={isCreateMode ? null : cardId}
        variant="personal"
        icon={<Link2 className="h-4 w-4" />}
        inputClassName={`${inputClasses} pl-10 font-mono`}
      />
    )
  }

  if (control === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={`${inputClasses} resize-y`}
        placeholder={label ? `Enter ${label.toLowerCase()}` : undefined}
      />
    )
  }

  if (control === 'date') {
    return <VCardDateInput value={value} onChange={(e) => onChange(e.target.value)} className={inputClasses} />
  }

  if (control === 'color') {
    return (
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value || '#4f46e5'}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-[#0b0f19]"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClasses}
          placeholder="#4f46e5"
        />
      </div>
    )
  }

  if (control === 'select') {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClasses}>
        <option value="">Select…</option>
        {(options || []).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  if (control === 'tags') {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClasses}
        placeholder="Comma-separated tags"
      />
    )
  }

  if (control === 'rating') {
    return (
      <select value={value || '5'} onChange={(e) => onChange(e.target.value)} className={selectClasses}>
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={String(n)}>
            {n} star{n === 1 ? '' : 's'}
          </option>
        ))}
      </select>
    )
  }

  const type = control === 'email' ? 'email' : control === 'tel' ? 'tel' : control === 'url' ? 'url' : 'text'

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClasses}
      placeholder={label ? `Enter ${label.toLowerCase()}` : undefined}
    />
  )
}

function createCustomTabItem(): VCardCustomTabItem {
  return {
    id: `custom_item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    description: '',
    url: '',
    mediaUrl: '',
    mediaName: '',
    mediaKind: 'upload',
    gallery: [],
    active: true,
  }
}

function seedEntry(
  edit: Extract<CompletionFieldEdit, { type: 'seed-list' }>,
  data: VCardData,
  updateData: (path: string, value: unknown) => void
) {
  switch (edit.collection) {
    case 'education':
      updateData('education', [...(data.education || []), createDefaultEducationEntry()])
      break
    case 'experience':
      updateData('experience', [...(data.experience || []), createDefaultExperienceEntry()])
      break
    case 'skills':
      updateData('skills', [...(data.skills || []), createDefaultSkillGroup()])
      break
    case 'services':
      updateData('services', [...(data.services || []), createDefaultServiceEntry()])
      break
    case 'portfolio':
      updateData('portfolio', [...(data.portfolio || []), createDefaultPortfolioEntry()])
      break
    case 'reviews':
      updateData('reviews', [...(data.reviews || []), createDefaultReviewEntry()])
      break
    case 'faqs':
      updateData('faqs', [...(data.faqs || []), createDefaultFaqEntry()])
      break
    case 'generalPosts':
      updateData('generalPosts', [...(data.generalPosts || []), createDefaultGeneralPost()])
      break
    case 'sectionPosts':
    case 'certificates': {
      const postType = edit.postTypeName
      if (!postType) return
      const current = data.sectionPosts?.[postType] || []
      updateData('sectionPosts', {
        ...(data.sectionPosts || {}),
        [postType]: [...current, createDefaultSectionPostItem()],
      })
      break
    }
    case 'customTabItems': {
      if (!edit.tabId) return
      const tabs = data.customTabs || []
      updateData(
        'customTabs',
        tabs.map((tab) =>
          tab.id === edit.tabId ? { ...tab, items: [...(tab.items || []), createCustomTabItem()] } : tab
        )
      )
      break
    }
  }
}

function patchListItem(
  data: VCardData,
  updateData: (path: string, value: unknown) => void,
  edit: Extract<CompletionFieldEdit, { type: 'list-field' }>,
  value: unknown
) {
  const { collection, itemId, field } = edit

  const patchArray = <T extends { id: string }>(path: string, items: T[] | undefined) => {
    updateData(
      path,
      (items || []).map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    )
  }

  switch (collection) {
    case 'education':
      patchArray('education', data.education)
      break
    case 'experience':
      patchArray('experience', data.experience)
      break
    case 'skills':
      if (field === 'skills') {
        const tags = String(value)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
        updateData(
          'skills',
          (data.skills || []).map((item) => (item.id === itemId ? { ...item, skills: tags } : item))
        )
      } else {
        patchArray('skills', data.skills)
      }
      break
    case 'services':
      patchArray('services', data.services)
      break
    case 'portfolio':
      patchArray('portfolio', data.portfolio)
      break
    case 'reviews':
      if (field === 'rating') {
        updateData(
          'reviews',
          (data.reviews || []).map((item) => (item.id === itemId ? { ...item, rating: Number(value) || 0 } : item))
        )
      } else {
        patchArray('reviews', data.reviews)
      }
      break
    case 'faqs':
      patchArray('faqs', data.faqs)
      break
    case 'generalPosts':
      patchArray('generalPosts', data.generalPosts)
      break
    case 'sectionPosts':
    case 'certificates': {
      const postType = edit.postTypeName
      if (!postType) return
      const current = data.sectionPosts?.[postType] || []
      updateData('sectionPosts', {
        ...(data.sectionPosts || {}),
        [postType]: current.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
      })
      break
    }
    case 'customTabItems': {
      if (!edit.tabId) return
      updateData(
        'customTabs',
        (data.customTabs || []).map((tab) =>
          tab.id === edit.tabId
            ? {
                ...tab,
                items: (tab.items || []).map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
              }
            : tab
        )
      )
      break
    }
  }
}

function readListFieldValue(data: VCardData, edit: Extract<CompletionFieldEdit, { type: 'list-field' }>): string {
  const find = <T extends { id: string }>(items: T[] | undefined): T | undefined =>
    (items || []).find((item) => item.id === edit.itemId)

  switch (edit.collection) {
    case 'education': {
      const item = find(data.education)
      return item ? String((item as Record<string, unknown>)[edit.field] ?? '') : ''
    }
    case 'experience': {
      const item = find(data.experience)
      return item ? String((item as Record<string, unknown>)[edit.field] ?? '') : ''
    }
    case 'skills': {
      const item = find(data.skills)
      if (!item) return ''
      if (edit.field === 'skills') return (item.skills || []).join(', ')
      return String((item as Record<string, unknown>)[edit.field] ?? '')
    }
    case 'services': {
      const item = find(data.services)
      return item ? String((item as Record<string, unknown>)[edit.field] ?? '') : ''
    }
    case 'portfolio': {
      const item = find(data.portfolio)
      return item ? String((item as Record<string, unknown>)[edit.field] ?? '') : ''
    }
    case 'reviews': {
      const item = find(data.reviews)
      return item ? String((item as Record<string, unknown>)[edit.field] ?? '') : ''
    }
    case 'faqs': {
      const item = find(data.faqs)
      return item ? String((item as Record<string, unknown>)[edit.field] ?? '') : ''
    }
    case 'generalPosts': {
      const item = find(data.generalPosts)
      return item ? String((item as Record<string, unknown>)[edit.field] ?? '') : ''
    }
    case 'sectionPosts':
    case 'certificates': {
      const posts = data.sectionPosts?.[edit.postTypeName || ''] as VCardSectionPostItem[] | undefined
      const item = find(posts)
      return item ? String((item as Record<string, unknown>)[edit.field] ?? '') : ''
    }
    case 'customTabItems': {
      const tab = data.customTabs?.find((entry) => entry.id === edit.tabId)
      const item = find(tab?.items)
      return item ? String((item as Record<string, unknown>)[edit.field] ?? '') : ''
    }
    default:
      return ''
  }
}

function SocialQuickFill() {
  const { vCardData, updateData } = useVCard()
  const social = vCardData.social ?? createDefaultVCardSocial()
  const [platform, setPlatform] = useState<string>('instagram')
  const [value, setValue] = useState('')

  const apply = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    if (platform === 'website') {
      updateData('personal.website', trimmed)
      setValue('')
      return
    }
    if (platform === 'custom') {
      const links = [...(social.customLinks || [])]
      links.push({ id: String(Date.now()), name: 'Link', url: trimmed })
      updateData('social.customLinks', links)
      setValue('')
      return
    }
    updateData('social.handles', { ...(social.handles || {}), [platform]: trimmed })
    setValue('')
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Platform</FieldLabel>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={selectClasses}>
          {SOCIAL_PLATFORMS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <FieldLabel>{platform === 'website' || platform === 'custom' ? 'URL' : 'Handle / username'}</FieldLabel>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={inputClasses}
          placeholder={platform === 'website' || platform === 'custom' ? 'https://…' : '@username'}
        />
      </div>
      <button
        type="button"
        onClick={apply}
        disabled={!value.trim()}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-indigo-700 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
        Add link
      </button>
    </div>
  )
}

function ExtraRowFill() {
  const { vCardData, updateData } = useVCard()
  const [name, setName] = useState('')
  const [value, setValue] = useState('')

  const apply = () => {
    if (!name.trim() || !value.trim()) return
    const current = vCardData.extraFields || []
    const next: VCardExtraField[] = [
      ...current,
      { id: String(Date.now()), icon: 'Link', name: name.trim(), value: value.trim() },
    ]
    updateData('extraFields', next)
    setName('')
    setValue('')
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Label</FieldLabel>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClasses}
          placeholder="e.g. Languages"
        />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Value</FieldLabel>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={inputClasses}
          placeholder="e.g. English, Bangla"
        />
      </div>
      <button
        type="button"
        onClick={apply}
        disabled={!name.trim() || !value.trim()}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-indigo-700 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
        Add row
      </button>
    </div>
  )
}

function ResumeSummaryFill() {
  const { vCardData, updateData } = useVCard()
  const sections = (vCardData as { sections?: Record<string, unknown> }).sections || {}
  const block = (sections.Resume || {}) as { title?: string; summary?: string; documents?: UploadedDoc[] }
  const initial = block.summary || ''
  const [draft, setDraft] = useState(initial)
  const trimmed = draft.trim()
  const canApply = Boolean(trimmed) && trimmed !== initial.trim()

  return (
    <DeferredApplyRow
      label="Summary"
      stacked
      canApply={canApply}
      onApply={() =>
        updateData('sections', {
          ...sections,
          Resume: { title: block.title || 'Resume', summary: draft, documents: block.documents || [] },
        })
      }
    >
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        className={`${inputClasses} resize-y`}
        placeholder="Short resume summary"
      />
    </DeferredApplyRow>
  )
}

function ResumeDocumentFill() {
  const { vCardData, updateData } = useVCard()
  const sections = (vCardData as { sections?: Record<string, unknown> }).sections || {}
  const block = (sections.Resume || {}) as { title?: string; summary?: string; documents?: UploadedDoc[] }
  const docs = Array.isArray(block.documents) ? block.documents : []

  return (
    <DocumentUploadArea
      files={docs}
      accent="teal"
      label="Resume document"
      hint="PDF or DOC"
      mediaAssist="image"
      onChange={(files) =>
        updateData('sections', {
          ...sections,
          Resume: { title: block.title || 'Resume', summary: block.summary || '', documents: files },
        })
      }
    />
  )
}

function ContentGalleryFill() {
  const { vCardData, updateData } = useVCard()
  const cm = {
    gallery: [] as Array<{ id: string; url: string; name: string }>,
    videos: [] as Array<{ id: string; title: string; url: string }>,
    note: '',
    ...((vCardData as { contentMedia?: Record<string, unknown> }).contentMedia || {}),
  }
  const gallery = (cm.gallery || []) as Array<{ id: string; url: string; name: string }>

  return (
    <DocumentUploadArea
      files={gallery.map((g) => ({ id: g.id, name: g.name, url: g.url, type: 'image/*', size: 0 }))}
      accent="violet"
      label="Gallery images"
      hint="PNG, JPG, WEBP"
      mediaAssist="image"
      onChange={(files) =>
        updateData('contentMedia', {
          ...cm,
          gallery: files.map((f) => ({ id: f.id, url: f.url, name: f.name })),
        })
      }
    />
  )
}

function ContentVideoFill() {
  const { vCardData, updateData } = useVCard()
  const cm = {
    gallery: [] as Array<{ id: string; url: string; name: string }>,
    videos: [] as Array<{ id: string; title: string; url: string }>,
    note: '',
    ...((vCardData as { contentMedia?: Record<string, unknown> }).contentMedia || {}),
  }
  const videos = (cm.videos || []) as Array<{ id: string; title: string; url: string }>
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Title</FieldLabel>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClasses}
          placeholder="Video title"
        />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Video URL</FieldLabel>
        <input value={url} onChange={(e) => setUrl(e.target.value)} className={inputClasses} placeholder="https://…" />
      </div>
      <button
        type="button"
        disabled={!url.trim()}
        onClick={() => {
          updateData('contentMedia', {
            ...cm,
            videos: [{ id: `vid_${Date.now()}`, title: title.trim() || 'Video', url: url.trim() }, ...videos],
          })
          setUrl('')
          setTitle('')
        }}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-indigo-700 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
        Add video
      </button>
    </div>
  )
}

function AboutMeDraftQuickFill({
  fieldKey,
  label,
  profileId,
}: {
  fieldKey: Extract<CompletionFieldEdit, { type: 'about-me-draft' }>['field']
  label: string
  profileId?: string
}) {
  const dispatch = useAppDispatch()
  const initial = getAboutMeDraft()
  const [title, setTitle] = useState(initial.title)
  const [descriptionHtml, setDescriptionHtml] = useState(initial.descriptionHtml)
  const [featuredMediaUrl, setFeaturedMediaUrl] = useState(initial.featuredMediaUrl)

  const persistDraft = (partial: Parameters<typeof setAboutMeDraft>[0], mode: 'schedule' | 'flush' = 'flush') => {
    setAboutMeDraft(partial)
    if (!profileId) return
    if (mode === 'schedule') scheduleAboutMeUpsert(dispatch, profileId)
    else void flushAboutMeUpsert(dispatch, profileId)
  }

  if (fieldKey === 'featuredMediaUrl') {
    const commit = (next: string) => {
      setFeaturedMediaUrl(next)
      persistDraft({ featuredMediaUrl: next }, 'schedule')
    }
    return (
      <div className="space-y-3">
        <MediaFileUploader
          label="Featured media"
          accent="violet"
          profileId={profileId}
          attachmentType="About Me Featured"
          accept="image/*,video/*"
          allowUrlPaste={false}
          hint="Upload an image or a video. The public About Me section shows this same file."
          value={featuredMediaUrl}
          onChange={(next) => commit(next?.url || '')}
        />
        <MediaSourceActions
          mode="both"
          compact
          showVideoExtras
          profileId={profileId}
          onSelect={(asset) => commit(asset.url)}
        />
      </div>
    )
  }

  if (fieldKey === 'descriptionHtml') {
    const canApply =
      isAboutMeDescriptionFilled(descriptionHtml) && descriptionHtml.trim() !== (initial.descriptionHtml || '').trim()
    return (
      <DeferredApplyRow label={label} stacked canApply={canApply} onApply={() => persistDraft({ descriptionHtml })}>
        <RichTextEditor
          value={descriptionHtml}
          onChange={setDescriptionHtml}
          placeholder="Share your story, background, and what makes you unique…"
          minHeightClassName="min-h-36"
        />
      </DeferredApplyRow>
    )
  }

  const trimmed = title.trim()
  const canApply = Boolean(trimmed) && trimmed !== initial.title.trim()
  return (
    <DeferredApplyRow label={label} canApply={canApply} onApply={() => persistDraft({ title: trimmed })}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="About Me"
        className={aboutMeInputClasses}
      />
    </DeferredApplyRow>
  )
}

export function CompletionQuickFillEditor({ field }: { field: VCardCompletionField }) {
  const { vCardData, updateData, updateMeta, cardId, isCreateMode, avatarImageUrl } = useVCard()
  const { getCustomValue, setCustomValue } = useVCardDisplayEditor()
  const { can } = usePackageAccess()
  const profileId = cardId && !isLocalTempId(cardId) ? cardId : undefined
  const edit = field.edit

  const listValue = useMemo(() => {
    if (!edit || edit.type !== 'list-field') return ''
    return readListFieldValue(vCardData, edit)
  }, [edit, vCardData])

  if (!edit) {
    return <p className="text-xs font-semibold text-slate-500">This checklist item is read-only.</p>
  }

  if (edit.type === 'seed-list') {
    return (
      <button
        type="button"
        onClick={() => seedEntry(edit, vCardData, updateData)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-black text-white transition hover:bg-indigo-700"
      >
        <Plus className="h-4 w-4" />
        Add first {edit.label || 'entry'}
      </button>
    )
  }

  if (edit.type === 'social-quick') return <SocialQuickFill />
  if (edit.type === 'extra-row') return <ExtraRowFill />
  if (edit.type === 'resume-summary') return <ResumeSummaryFill />
  if (edit.type === 'resume-document') return <ResumeDocumentFill />
  if (edit.type === 'content-gallery') return <ContentGalleryFill />
  if (edit.type === 'content-video') return <ContentVideoFill />
  if (edit.type === 'about-me-draft') {
    return <AboutMeDraftQuickFill fieldKey={edit.field} label={field.label} profileId={profileId} />
  }

  if (edit.type === 'display-media') {
    const value = getCustomValue(edit.fieldKey) || (edit.alsoUpdateMeta === 'avatar' ? avatarImageUrl || '' : '')
    const gate = displayMediaAccess(edit.fieldKey, can)
    const accept = gate.allowVideo
      ? edit.accept
      : edit.accept
          .split(',')
          .map((part) => part.trim())
          .filter((part) => part && !part.startsWith('video/'))
          .join(',') || 'image/*'
    return (
      <VCardMediaField
        value={value}
        onChange={(url) => {
          setCustomValue(edit.fieldKey, url || '')
          if (edit.alsoUpdateMeta === 'avatar') updateMeta({ avatarImageUrl: url || '' })
        }}
        profileId={profileId}
        attachmentType={edit.attachmentType}
        accept={accept}
        locked={gate.locked}
        allowVideo={gate.allowVideo}
        allowAudio={gate.allowAudio}
        title={field.label}
        subtitle={field.hint || 'Upload media'}
        icon={<ImageIcon className="text-primary-600 dark:text-primary-400 h-5 w-5" />}
        selectPlaceholder="Select file"
        previewKind={edit.previewKind || 'auto'}
        variant="inset"
      >
        <MediaSourceActions
          mode={gate.sourceMode === 'video' ? 'video' : gate.sourceMode}
          compact
          className="mt-3"
          onSelect={(asset) => {
            setCustomValue(edit.fieldKey, asset.url)
            if (edit.alsoUpdateMeta === 'avatar') updateMeta({ avatarImageUrl: asset.url })
          }}
        />
      </VCardMediaField>
    )
  }

  if (edit.type === 'dual-scalar') {
    return (
      <DeferredDualScalarField
        edit={edit}
        vCardData={vCardData}
        updateData={updateData}
        cardId={cardId}
        isCreateMode={isCreateMode}
      />
    )
  }

  if (edit.type === 'scalar') {
    return (
      <DeferredScalarField
        label={field.label}
        control={edit.control}
        initialValue={getPathValue(vCardData, edit.path)}
        options={edit.options}
        cardId={cardId}
        isCreateMode={isCreateMode}
        onApply={(value) => updateData(edit.path, value)}
      />
    )
  }

  if (edit.type === 'list-field') {
    if (edit.control === 'media') {
      return (
        <VCardMediaField
          value={listValue}
          onChange={(url) => patchListItem(vCardData, updateData, edit, url || '')}
          profileId={profileId}
          attachmentType={`${edit.collection}-${edit.field}`}
          accept={edit.accept || 'image/*'}
          title={field.label}
          subtitle={field.hint || 'Upload media'}
          icon={<Upload className="text-primary-600 dark:text-primary-400 h-5 w-5" />}
          selectPlaceholder="Select file"
          previewKind="auto"
          variant="inset"
        >
          <MediaSourceActions
            mode="both"
            compact
            className="mt-3"
            onSelect={(asset) => patchListItem(vCardData, updateData, edit, asset.url)}
          />
        </VCardMediaField>
      )
    }

    return (
      <DeferredScalarField
        label={field.label}
        control={edit.control}
        initialValue={listValue}
        cardId={cardId}
        isCreateMode={isCreateMode}
        onApply={(value) => patchListItem(vCardData, updateData, edit, value)}
      />
    )
  }

  return null
}

function DeferredDualScalarField({
  edit,
  vCardData,
  updateData,
  cardId,
  isCreateMode,
}: {
  edit: Extract<CompletionFieldEdit, { type: 'dual-scalar' }>
  vCardData: VCardData
  updateData: (path: string, value: unknown) => void
  cardId?: string | null
  isCreateMode?: boolean
}) {
  const controls = edit.controls || (['text', 'text'] as [CompletionScalarControl, CompletionScalarControl])
  const initial0 = getPathValue(vCardData, edit.paths[0])
  const initial1 = getPathValue(vCardData, edit.paths[1])
  const [draft0, setDraft0] = useState(initial0)
  const [draft1, setDraft1] = useState(initial1)
  const canApply =
    (Boolean(draft0.trim()) && draft0.trim() !== initial0.trim()) ||
    (Boolean(draft1.trim()) && draft1.trim() !== initial1.trim())

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>{edit.labels[0]}</FieldLabel>
        <ScalarControl
          control={controls[0] || 'text'}
          value={draft0}
          onChange={setDraft0}
          options={edit.options?.[0]}
          label={edit.labels[0]}
          cardId={cardId}
          isCreateMode={isCreateMode}
        />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>{edit.labels[1]}</FieldLabel>
        <ScalarControl
          control={controls[1] || 'text'}
          value={draft1}
          onChange={setDraft1}
          options={edit.options?.[1]}
          label={edit.labels[1]}
          cardId={cardId}
          isCreateMode={isCreateMode}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold text-slate-400">Fill either field, then Apply to complete.</p>
        <button
          type="button"
          disabled={!canApply}
          onClick={() => {
            if (draft0.trim() !== initial0.trim()) updateData(edit.paths[0], draft0)
            if (draft1.trim() !== initial1.trim()) updateData(edit.paths[1], draft1)
          }}
          className={applyButtonClasses}
        >
          <Check className="h-3.5 w-3.5" />
          Apply
        </button>
      </div>
    </div>
  )
}
