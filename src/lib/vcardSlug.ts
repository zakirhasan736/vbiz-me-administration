/** Public URL slug from a display name. Empty when the name has no slug characters. */
export function slugFromDisplayName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function shouldAutofillSlugFromName(slug: string | null | undefined): boolean {
  return !String(slug || '').trim()
}
