import type { VCardPortfolioEntry } from '@/types/vcard'

export function createDefaultPortfolioEntry(): VCardPortfolioEntry {
  return {
    id: `pf_${Date.now()}`,
    type: 'Image',
    title: '',
    description: '',
    imageUrl: '',
    imageName: '',
    attachments: null,
    url: '',
    active: true,
  }
}

export function normalizePortfolioList(raw?: VCardPortfolioEntry[] | null): VCardPortfolioEntry[] {
  if (!raw?.length) return []
  return raw.map((entry) => {
    const attachments =
      entry.attachments && typeof entry.attachments === 'object' && entry.attachments.url
        ? { url: entry.attachments.url, name: entry.attachments.name || '' }
        : null
    return {
      id: entry.id || `pf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: entry.type || 'Image',
      title: entry.title ?? '',
      description: entry.description ?? '',
      imageUrl: entry.imageUrl ?? '',
      imageName: entry.imageName ?? '',
      attachments,
      url: entry.url ?? '',
      active: entry.active !== false,
    }
  })
}
