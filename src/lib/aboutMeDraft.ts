/** Session-local About Me draft (synced to API via aboutMePersist when a profile id exists). */

export type AboutMeDraft = {
  title: string
  descriptionHtml: string
  featuredMediaUrl: string
}

const EMPTY: AboutMeDraft = {
  title: '',
  descriptionHtml: '',
  featuredMediaUrl: '',
}

let draft: AboutMeDraft = { ...EMPTY }
const listeners = new Set<() => void>()

export function getAboutMeDraft(): AboutMeDraft {
  return draft
}

export function setAboutMeDraft(partial: Partial<AboutMeDraft>): void {
  draft = { ...draft, ...partial }
  listeners.forEach((fn) => fn())
}

export function resetAboutMeDraft(): void {
  draft = { ...EMPTY }
  listeners.forEach((fn) => fn())
}

export function subscribeAboutMeDraft(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function isAboutMeDescriptionFilled(html: string): boolean {
  const stripped = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
  return stripped.length > 0
}

export function hasAboutMeDraftContent(value: AboutMeDraft = draft): boolean {
  return Boolean(
    value.title.trim() || isAboutMeDescriptionFilled(value.descriptionHtml) || value.featuredMediaUrl.trim()
  )
}
