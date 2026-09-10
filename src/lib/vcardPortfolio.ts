import type { VCardPortfolioEntry } from '@/types/vcard'

export function createDefaultPortfolioEntry(): VCardPortfolioEntry {
  return {
    id: `pf_${Date.now()}`,
    type: 'Image',
    title: '',
    description: '',
    imageUrl: '',
    imageName: '',
    url: '',
    active: true,
  }
}

export function normalizePortfolioList(raw?: VCardPortfolioEntry[] | null): VCardPortfolioEntry[] {
  if (!raw?.length) return []
  return raw.map((entry) => {
    const rawType = entry.type || 'Image'
    // Gallery / Photos no longer supports Audio as a portfolio type.
    const type = rawType === 'Audio' ? 'Image' : rawType
    return {
      id: entry.id || `pf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      title: entry.title ?? '',
      description: entry.description ?? '',
      imageUrl: entry.imageUrl ?? '',
      imageName: entry.imageName ?? '',
      url: entry.url ?? '',
      active: entry.active !== false,
    }
  })
}
