import { decodeHtmlText } from '@/lib/htmlText'
import type { VCardData, VCardResume, VCardResumeDocument } from '@/types/vcard'

export const RESUME_SETTING_KEY = 'resume_json'

export const DEFAULT_VCARD_RESUME: VCardResume = {
  title: 'Resume',
  summary: '',
  documents: [],
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeDocument(raw: unknown, index: number): VCardResumeDocument | null {
  if (!raw || typeof raw !== 'object') {
    if (typeof raw === 'string' && raw.trim()) {
      return {
        id: `resume_doc_${index}`,
        name: 'Resume document',
        url: raw.trim(),
        type: 'application/octet-stream',
        size: 0,
      }
    }
    return null
  }
  const doc = raw as Record<string, unknown>
  const url = asString(doc.url).trim()
  if (!url) return null
  return {
    id: asString(doc.id, `resume_doc_${index}`),
    name: asString(doc.name, 'Resume document'),
    url,
    type: asString(doc.type, 'application/octet-stream'),
    size: typeof doc.size === 'number' && Number.isFinite(doc.size) ? doc.size : 0,
  }
}

function documentsFromBlock(block: Record<string, unknown> | null | undefined): VCardResumeDocument[] {
  if (!block) return []
  if (Array.isArray(block.documents)) {
    return block.documents.map(normalizeDocument).filter((d): d is VCardResumeDocument => Boolean(d))
  }
  if (block.document) {
    const single = normalizeDocument(block.document, 0)
    return single ? [single] : []
  }
  if (typeof block.url === 'string' && block.url.trim()) {
    const single = normalizeDocument(
      {
        id: 'resume_link',
        name: asString(block.fileName, 'Linked resume'),
        url: block.url,
        type: 'application/octet-stream',
        size: 0,
      },
      0
    )
    return single ? [single] : []
  }
  return []
}

/** Normalize editor / settings / legacy shapes into a stable Resume block. */
export function normalizeVCardResume(
  raw: unknown,
  legacy?: { title?: string; summary?: string; url?: string; fileName?: string } | null
): VCardResume {
  if (!raw || typeof raw !== 'object') {
    if (legacy?.url?.trim()) {
      return {
        title: asString(legacy.title, DEFAULT_VCARD_RESUME.title) || DEFAULT_VCARD_RESUME.title,
        summary: asString(legacy.summary),
        documents: [
          {
            id: 'resume_link',
            name: asString(legacy.fileName, 'Linked resume'),
            url: legacy.url.trim(),
            type: 'application/octet-stream',
            size: 0,
          },
        ],
      }
    }
    return { ...DEFAULT_VCARD_RESUME, documents: [] }
  }

  const block = raw as Record<string, unknown>
  const documents = documentsFromBlock(block)
  if (!documents.length && legacy?.url?.trim()) {
    documents.push({
      id: 'resume_link',
      name: asString(legacy.fileName, 'Linked resume'),
      url: legacy.url.trim(),
      type: 'application/octet-stream',
      size: 0,
    })
  }

  return {
    title: asString(block.title || legacy?.title, DEFAULT_VCARD_RESUME.title) || DEFAULT_VCARD_RESUME.title,
    summary: asString(block.summary || block.body || legacy?.summary),
    documents,
  }
}

/** Resolve Resume from typed field, legacy `sections.Resume`, or empty default. */
export function getVCardResume(data: VCardData): VCardResume {
  const withLegacy = data as VCardData & { sections?: Record<string, unknown> }

  // Prefer the typed field whenever it has been set on the card.
  if (data.resume !== undefined) {
    return normalizeVCardResume(data.resume)
  }

  const sectionsBlock = withLegacy.sections?.Resume
  if (sectionsBlock) {
    return normalizeVCardResume(sectionsBlock)
  }

  return { ...DEFAULT_VCARD_RESUME, documents: [] }
}

export function parseResumeJson(raw?: string | null): VCardResume {
  if (!raw?.trim()) return { ...DEFAULT_VCARD_RESUME, documents: [] }
  try {
    return normalizeVCardResume(JSON.parse(raw) as unknown)
  } catch {
    return { ...DEFAULT_VCARD_RESUME, documents: [] }
  }
}

export function mapResumeToApiSettings(resume?: VCardResume | null): Record<string, string> {
  const normalized = normalizeVCardResume(resume)
  return {
    [RESUME_SETTING_KEY]: JSON.stringify({
      title: decodeHtmlText(normalized.title) || DEFAULT_VCARD_RESUME.title,
      summary: normalized.summary,
      documents: normalized.documents.filter((doc) => doc.url.trim() && !doc.url.startsWith('blob:')),
    }),
  }
}

export function hasResumeContent(resume?: VCardResume | null): boolean {
  if (!resume) return false
  return Boolean(resume.summary?.trim()) || resume.documents.some((doc) => doc.url?.trim())
}
