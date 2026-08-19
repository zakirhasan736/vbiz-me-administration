'use client'

import { Modal } from '@/components/ui/Modal'
import { createDefaultExperienceEntry } from '@/lib/vcardExperience'
import { createDefaultFaqEntry } from '@/lib/vcardFaq'
import { createDefaultGeneralPost } from '@/lib/vcardGeneralPosts'
import { syncMyInfoFromPersonal } from '@/lib/vcardMyInfo'
import { createDefaultPortfolioEntry } from '@/lib/vcardPortfolio'
import { createDefaultReviewEntry } from '@/lib/vcardReviews'
import { createDefaultServiceEntry } from '@/lib/vcardServices'
import type { VCardData, VCardPersonal } from '@/types/vcard'
import { Pencil, Plus, Sparkles, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

type Props = {
  open: boolean
  navId: string
  label: string
  data: VCardData
  busy?: boolean
  onClose: () => void
  onApply: (next: VCardData) => void
  onGenerateAi?: () => Promise<void>
}

type ScalarField = {
  key: keyof VCardPersonal | 'slug' | 'seoTitle' | 'seoDescription' | 'seoKeywords'
  label: string
  type?: 'text' | 'email' | 'tel' | 'date' | 'textarea'
}

function hasText(value?: string | null) {
  return Boolean(value && String(value).trim())
}

function FieldRow({
  label,
  filled,
  editing,
  onEdit,
  onAdd,
  children,
}: {
  label: string
  filled: boolean
  editing: boolean
  onEdit: () => void
  onAdd: () => void
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/50">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-black text-slate-700 dark:text-slate-200">{label}</p>
        {editing ? null : filled ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        )}
      </div>
      {editing ? (
        children
      ) : filled ? (
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{children}</p>
      ) : null}
    </div>
  )
}

export function LaunchTabReviewModal({ open, navId, label, data, busy, onClose, onApply, onGenerateAi }: Props) {
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const personal = data.personal || ({} as VCardPersonal)
  const seo = data.seo

  const scalars = useMemo<ScalarField[]>(() => {
    if (navId === 'home') {
      return [
        { key: 'fullName', label: 'Full name / card name' },
        { key: 'company', label: 'Company / business name' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'dob', label: 'Date of birth', type: 'date' },
        { key: 'designation', label: 'Headline / title' },
        { key: 'website', label: 'Website' },
        { key: 'address', label: 'Address / location' },
        { key: 'slug', label: 'Public URL slug' },
        { key: 'seoTitle', label: 'SEO meta title' },
        { key: 'seoDescription', label: 'SEO meta description', type: 'textarea' },
        { key: 'seoKeywords', label: 'SEO keywords' },
      ]
    }
    if (navId === 'about') return [{ key: 'about', label: 'About Me', type: 'textarea' }]
    return []
  }, [navId])

  const patchPersonal = (key: keyof VCardPersonal, value: string) => {
    onApply(syncMyInfoFromPersonal({ ...data, personal: { ...personal, [key]: value } }))
  }

  const scalarValue = (field: ScalarField) => {
    if (field.key === 'slug') return data.slug || ''
    if (field.key === 'seoTitle') return seo?.metaTitle || ''
    if (field.key === 'seoDescription') return seo?.metaDescription || ''
    if (field.key === 'seoKeywords') return (seo?.metaKeywords || []).join(', ')
    return String(personal[field.key as keyof VCardPersonal] || '')
  }

  const setScalar = (field: ScalarField, value: string) => {
    if (field.key === 'slug') {
      onApply({ ...data, slug: value })
      return
    }
    if (field.key === 'seoTitle') {
      onApply({
        ...data,
        seo: { metaTitle: value, metaDescription: seo?.metaDescription || '', metaKeywords: seo?.metaKeywords || [] },
      })
      return
    }
    if (field.key === 'seoDescription') {
      onApply({
        ...data,
        seo: { metaTitle: seo?.metaTitle || '', metaDescription: value, metaKeywords: seo?.metaKeywords || [] },
      })
      return
    }
    if (field.key === 'seoKeywords') {
      onApply({
        ...data,
        seo: {
          metaTitle: seo?.metaTitle || '',
          metaDescription: seo?.metaDescription || '',
          metaKeywords: value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        },
      })
      return
    }
    patchPersonal(field.key as keyof VCardPersonal, value)
  }

  const addKind =
    navId === 'faq'
      ? 'faqs'
      : navId === 'services'
        ? 'services'
        : navId === 'blog'
          ? 'blogs'
          : navId === 'gallery'
            ? 'portfolio'
            : navId === 'reviews'
              ? 'reviews'
              : navId === 'work'
                ? 'experience'
                : null

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-h-[88vh] w-full max-w-lg overflow-hidden rounded-3xl bg-white p-0 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
        <div>
          <p className="text-[10px] font-black tracking-wider text-indigo-600 uppercase">Review & edit</p>
          <h3 className="text-sm font-black text-slate-950 dark:text-white">{label}</h3>
        </div>
        <div className="flex items-center gap-2">
          {onGenerateAi ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onGenerateAi()}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-black text-white disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" /> Fill with AI
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="max-h-[70vh] space-y-2 overflow-y-auto px-4 py-3">
        {scalars.map((field) => {
          const value = scalarValue(field)
          const filled = hasText(value)
          const isEditing = Boolean(editing[field.key]) || !filled
          const input = (
            <input
              type={field.type === 'textarea' ? 'text' : field.type || 'text'}
              value={value}
              onChange={(event) => setScalar(field, event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-white/10 dark:bg-slate-950"
            />
          )
          const area = (
            <textarea
              value={value}
              onChange={(event) => setScalar(field, event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-white/10 dark:bg-slate-950"
            />
          )
          return (
            <FieldRow
              key={field.key}
              label={field.label}
              filled={filled && !editing[field.key]}
              editing={isEditing}
              onEdit={() => setEditing((prev) => ({ ...prev, [field.key]: true }))}
              onAdd={() => setEditing((prev) => ({ ...prev, [field.key]: true }))}
            >
              {isEditing ? (field.type === 'textarea' ? area : input) : value}
            </FieldRow>
          )
        })}

        {addKind === 'faqs' ? (
          <ListEditor
            addLabel="+ Add FAQ"
            items={(data.faqs || []).map((item) => ({ id: item.id, title: item.question, body: item.answer }))}
            onAdd={() => onApply({ ...data, faqs: [...(data.faqs || []), createDefaultFaqEntry()] })}
            onChange={(id, title, body) =>
              onApply({
                ...data,
                faqs: (data.faqs || []).map((item) =>
                  item.id === id ? { ...item, question: title, answer: body } : item
                ),
              })
            }
          />
        ) : null}
        {addKind === 'services' ? (
          <ListEditor
            addLabel="+ Add service"
            items={(data.services || []).map((item) => ({ id: item.id, title: item.title, body: item.description }))}
            onAdd={() => onApply({ ...data, services: [...(data.services || []), createDefaultServiceEntry()] })}
            onChange={(id, title, body) =>
              onApply({
                ...data,
                services: (data.services || []).map((item) =>
                  item.id === id ? { ...item, title, description: body } : item
                ),
              })
            }
          />
        ) : null}
        {addKind === 'portfolio' ? (
          <ListEditor
            addLabel="+ Add portfolio"
            items={(data.portfolio || []).map((item) => ({ id: item.id, title: item.title, body: item.description }))}
            onAdd={() => onApply({ ...data, portfolio: [...(data.portfolio || []), createDefaultPortfolioEntry()] })}
            onChange={(id, title, body) =>
              onApply({
                ...data,
                portfolio: (data.portfolio || []).map((item) =>
                  item.id === id ? { ...item, title, description: body } : item
                ),
              })
            }
          />
        ) : null}
        {addKind === 'reviews' ? (
          <ListEditor
            addLabel="+ Add testimonial"
            items={(data.reviews || []).map((item) => ({ id: item.id, title: item.author, body: item.text }))}
            onAdd={() => onApply({ ...data, reviews: [...(data.reviews || []), createDefaultReviewEntry()] })}
            onChange={(id, title, body) =>
              onApply({
                ...data,
                reviews: (data.reviews || []).map((item) =>
                  item.id === id ? { ...item, author: title, text: body } : item
                ),
              })
            }
          />
        ) : null}
        {addKind === 'blogs' ? (
          <ListEditor
            addLabel="+ Add blog"
            items={(data.generalPosts || []).map((item) => ({
              id: item.id,
              title: item.title,
              body: item.description,
            }))}
            onAdd={() => onApply({ ...data, generalPosts: [...(data.generalPosts || []), createDefaultGeneralPost()] })}
            onChange={(id, title, body) =>
              onApply({
                ...data,
                generalPosts: (data.generalPosts || []).map((item) =>
                  item.id === id ? { ...item, title, description: body } : item
                ),
              })
            }
          />
        ) : null}
        {addKind === 'experience' ? (
          <ListEditor
            addLabel="+ Add experience"
            items={(data.experience || []).map((item) => ({
              id: item.id,
              title: item.jobTitle || item.company,
              body: item.description,
            }))}
            onAdd={() => onApply({ ...data, experience: [...(data.experience || []), createDefaultExperienceEntry()] })}
            onChange={(id, title, body) =>
              onApply({
                ...data,
                experience: (data.experience || []).map((item) =>
                  item.id === id ? { ...item, jobTitle: title, description: body } : item
                ),
              })
            }
          />
        ) : null}

        {navId === 'home' ? (
          <p className="pt-1 text-[10px] font-semibold text-slate-400">
            Profile image, background media, and Canva assets can be uploaded in the editor after you save this review.
          </p>
        ) : null}
      </div>
    </Modal>
  )
}

function ListEditor({
  items,
  addLabel,
  onAdd,
  onChange,
}: {
  items: Array<{ id: string; title: string; body: string }>
  addLabel: string
  onAdd: () => void
  onChange: (id: string, title: string, body: string) => void
}) {
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const filled = hasText(item.title) || hasText(item.body)
        const isEditing = Boolean(editing[item.id]) || !filled
        return (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/50"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-black text-slate-700 dark:text-slate-200">Item {index + 1}</p>
              {isEditing ? null : (
                <button
                  type="button"
                  onClick={() => setEditing((prev) => ({ ...prev, [item.id]: true }))}
                  className="inline-flex items-center gap-1 text-[10px] font-black text-slate-500"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <input
                  value={item.title}
                  onChange={(event) => onChange(item.id, event.target.value, item.body)}
                  placeholder="Title"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-white/10 dark:bg-slate-950"
                />
                <textarea
                  value={item.body}
                  onChange={(event) => onChange(item.id, item.title, event.target.value)}
                  placeholder="Details"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-white/10 dark:bg-slate-950"
                />
              </div>
            ) : (
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">{item.title || 'Untitled'}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">{item.body}</p>
              </div>
            )}
          </div>
        )
      })}
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-[11px] font-black text-slate-600 dark:border-white/15 dark:text-slate-300"
      >
        <Plus className="h-3.5 w-3.5" /> {addLabel.replace(/^\+\s*/, '')}
      </button>
    </div>
  )
}
