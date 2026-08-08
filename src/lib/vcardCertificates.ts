import type { UploadedDoc } from '@/components/DocumentUploadArea'
import { PUBLIC_SECTION_NAMES } from '@/lib/vcardPublicSectionNames'
import type { VCardSectionPostItem } from '@/types/vcard'

export const CERTIFICATES_POST_TYPE = PUBLIC_SECTION_NAMES.certificates

export type CertItem = {
  id: string
  name: string
  description: string
  issuer: string
  year: string
  documents: UploadedDoc[]
}

export function createEmptyCert(): CertItem {
  return {
    id: `cert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    description: '',
    issuer: '',
    year: '',
    documents: [],
  }
}

function parseDocuments(raw: unknown, featuredImage?: string): UploadedDoc[] {
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return parseDocuments(JSON.parse(raw), featuredImage)
    } catch {
      return []
    }
  }
  if (Array.isArray(raw)) {
    return raw
      .map((entry, index) => {
        if (!entry || typeof entry !== 'object') return null
        const doc = entry as Record<string, unknown>
        const url = typeof doc.url === 'string' ? doc.url.trim() : ''
        if (!url) return null
        return {
          id: typeof doc.id === 'string' && doc.id ? doc.id : `doc_${index}`,
          name: typeof doc.name === 'string' && doc.name ? doc.name : 'Document',
          url,
          type: typeof doc.type === 'string' ? doc.type : 'application/octet-stream',
          size: typeof doc.size === 'number' ? doc.size : 0,
        } satisfies UploadedDoc
      })
      .filter(Boolean) as UploadedDoc[]
  }
  if (featuredImage?.trim()) {
    return [
      {
        id: 'featured',
        name: 'Certificate document',
        url: featuredImage.trim(),
        type: 'application/octet-stream',
        size: 0,
      },
    ]
  }
  return []
}

export function sectionPostsToCertItems(posts: VCardSectionPostItem[] | undefined | null): CertItem[] {
  if (!posts?.length) return []
  return posts.map((p, index) => {
    const metas = p.metas || {}
    const year = (typeof metas.year === 'string' && metas.year.trim()) || (p.date?.match(/^\d{4}/)?.[0] ?? '') || ''
    return {
      id: p.id || `cert_${index}`,
      name: p.title || '',
      description: p.description || '',
      issuer: typeof metas.issuer === 'string' ? metas.issuer : '',
      year,
      documents: parseDocuments(metas.documents, p.featuredImage),
    }
  })
}

export function certItemsToSectionPosts(items: CertItem[]): VCardSectionPostItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.name,
    description: item.description,
    url: '',
    featuredImage: item.documents[0]?.url || '',
    date: '',
    rating: '',
    location: '',
    active: true,
    metas: {
      issuer: item.issuer,
      year: item.year,
      documents: JSON.stringify(
        item.documents.map((d) => ({
          id: d.id,
          name: d.name,
          url: d.url,
          type: d.type,
          size: d.size,
        }))
      ),
    },
  }))
}
