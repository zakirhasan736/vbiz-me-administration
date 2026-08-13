'use client'

import { DocumentUploadArea, type UploadedDoc } from '@/components/DocumentUploadArea'
import { useVCard } from '@/lib/VCardContext'
import { FileText } from 'lucide-react'
import { useState } from 'react'

const SECTION = 'Resume'

type ResumeState = {
  title: string
  summary: string
  documents: UploadedDoc[]
}

const normalize = (
  raw: unknown,
  legacyResume?: { title?: string; summary?: string; url?: string; fileName?: string }
): ResumeState => {
  if (!raw || typeof raw !== 'object') {
    if (legacyResume?.url) {
      return {
        title: String(legacyResume.title || 'Resume'),
        summary: String(legacyResume.summary || ''),
        documents: [
          {
            id: 'resume_link',
            name: legacyResume.fileName || 'Linked resume',
            url: String(legacyResume.url),
            type: 'application/octet-stream',
            size: 0,
          },
        ],
      }
    }
    return { title: 'Resume', summary: '', documents: [] }
  }
  const block = raw as Record<string, unknown>
  const docs: UploadedDoc[] = Array.isArray(block.documents)
    ? (block.documents as UploadedDoc[])
    : block.document
      ? [block.document as UploadedDoc]
      : block.url
        ? [
            {
              id: 'resume_link',
              name: 'Linked resume',
              url: String(block.url),
              type: 'application/octet-stream',
              size: 0,
            },
          ]
        : legacyResume?.url
          ? [
              {
                id: 'resume_link',
                name: legacyResume.fileName || 'Linked resume',
                url: String(legacyResume.url),
                type: 'application/octet-stream',
                size: 0,
              },
            ]
          : []
  return {
    title: String(block.title || legacyResume?.title || 'Resume'),
    summary: String(block.summary || block.body || legacyResume?.summary || ''),
    documents: docs,
  }
}

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-sm'

export function TabResume() {
  const { vCardData, updateData, cardId } = useVCard()
  const sections = (vCardData as { sections?: Record<string, unknown> }).sections
  const legacyResume = (vCardData as { resume?: { title?: string; summary?: string; url?: string; fileName?: string } })
    .resume

  const [state, setState] = useState<ResumeState>(() => normalize(sections?.[SECTION], legacyResume))
  const [prevCardId, setPrevCardId] = useState(cardId)

  // Re-sync when card identity changes (create → edit / switch cards).
  // Adjust during render — avoids setState-in-effect cascading renders.
  if (cardId !== prevCardId) {
    setPrevCardId(cardId)
    setState(normalize(sections?.[SECTION], legacyResume))
  }

  const persist = (next: ResumeState) => {
    setState(next)
    updateData('sections', {
      ...(sections || {}),
      [SECTION]: next,
    })
  }

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col space-y-6 pb-12 duration-500">
      <div className="rounded-3xl border border-teal-100 bg-teal-50/50 p-6 dark:border-teal-500/10 dark:bg-teal-500/2">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-teal-100 bg-teal-50 dark:border-teal-500/20 dark:bg-teal-500/10">
            <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-teal-600 dark:text-teal-400">Resume / CV</h3>
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
            placeholder="Resume"
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
          files={state.documents}
          onChange={(documents) => persist({ ...state, documents })}
          multiple
          label="Resume document upload"
          hint="Image, PDF, TXT, DOC / DOCX — max 5MB each"
          accent="teal"
          mediaAssist="image"
        />
      </div>
    </div>
  )
}
