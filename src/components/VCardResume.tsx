'use client'

import { DocumentUploadArea, type UploadedDoc } from '@/components/DocumentUploadArea'
import { useVCard } from '@/lib/VCardContext'
import { DEFAULT_VCARD_RESUME, getVCardResume, normalizeVCardResume } from '@/lib/vcardResume'
import { useResolvedSectionTitle } from '@/profile-app/lib/sectionTitleContext'
import type { VCardResume } from '@/types/vcard'
import { FileText } from 'lucide-react'
import { useState } from 'react'

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-sm'

export function TabResume() {
  const sectionTitle = useResolvedSectionTitle(undefined, 'Resume')
  const { vCardData, updateData, cardId } = useVCard()

  const [state, setState] = useState<VCardResume>(() => getVCardResume(vCardData))
  const [prevCardId, setPrevCardId] = useState(cardId)

  // Re-sync when card identity changes (create → edit / switch cards).
  if (cardId !== prevCardId) {
    setPrevCardId(cardId)
    setState(getVCardResume(vCardData))
  }

  const persist = (next: VCardResume) => {
    const normalized = normalizeVCardResume(next)
    setState(normalized)
    updateData('resume', normalized)
  }

  const documents: UploadedDoc[] = state.documents.map((doc) => ({
    id: doc.id,
    name: doc.name,
    url: doc.url,
    type: doc.type,
    size: doc.size,
  }))

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col space-y-6 pb-12 duration-500">
      <div className="rounded-3xl border border-teal-100 bg-teal-50/50 p-6 dark:border-teal-500/10 dark:bg-teal-500/2">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-teal-100 bg-teal-50 dark:border-teal-500/20 dark:bg-teal-500/10">
            <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-teal-600 dark:text-teal-400">{sectionTitle}</h3>
            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              Upload your resume as PDF, image, TXT, or Word document.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 rounded-[28px] border border-slate-200/60 bg-slate-50/40 p-6 dark:border-white/5 dark:bg-white/2">
        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Section title</span>
          <input
            value={state.title}
            onChange={(e) => persist({ ...state, title: e.target.value })}
            className={inputClasses}
            placeholder={DEFAULT_VCARD_RESUME.title}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Summary (optional)</span>
          <textarea
            value={state.summary}
            onChange={(e) => persist({ ...state, summary: e.target.value })}
            rows={4}
            placeholder="Short summary shown with your resume…"
            className={`${inputClasses} resize-y`}
          />
        </label>

        <DocumentUploadArea
          files={documents}
          onChange={(nextDocs) =>
            persist({
              ...state,
              documents: nextDocs.map((doc) => ({
                id: doc.id,
                name: doc.name,
                url: doc.url,
                type: doc.type,
                size: doc.size,
              })),
            })
          }
          multiple
          label="Resume document upload"
          hint="Image, PDF, TXT, DOC / DOCX"
          accent="teal"
          mediaAssist="image"
          profileId={cardId}
          attachmentType="Resume Document"
        />
      </div>
    </div>
  )
}
