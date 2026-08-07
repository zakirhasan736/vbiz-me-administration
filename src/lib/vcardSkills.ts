import type { VCardSkillGroup } from '@/types/vcard'

let skillGroupSeq = 0

export function createDefaultSkillGroup(): VCardSkillGroup {
  skillGroupSeq += 1
  return {
    id: `sk_${Date.now()}_${skillGroupSeq}`,
    type: '',
    skills: [],
  }
}

/** Stable empty group so the Skills editor does not remount inputs every render. */
const EMPTY_SKILL_GROUP: VCardSkillGroup = {
  id: 'sk_default',
  type: '',
  skills: [],
}

export function normalizeSkillGroups(raw?: VCardSkillGroup[] | null): VCardSkillGroup[] {
  if (!raw?.length) return [{ ...EMPTY_SKILL_GROUP, skills: [] }]
  return raw.map((entry) => ({
    id: entry.id || `sk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: entry.type ?? '',
    skills: Array.isArray(entry.skills) ? entry.skills.filter(Boolean) : [],
  }))
}

/** Flatten skill groups → API SkillTag rows (`level` stores category). */
export function skillGroupsToApiItems(groups: VCardSkillGroup[]): Array<{ name: string; level: string | null }> {
  const items: Array<{ name: string; level: string | null }> = []
  for (const group of groups) {
    const level = (group.type || '').trim() || null
    for (const skill of group.skills || []) {
      const name = String(skill || '').trim()
      if (!name) continue
      items.push({ name, level })
    }
  }
  return items
}

/** Group API SkillTag rows back into editor categories. */
export function skillTagsToGroups(
  tags: Array<{ id?: string; name?: string | null; level?: string | null }> | undefined | null
): VCardSkillGroup[] {
  if (!tags?.length) return []
  const byLevel = new Map<string, VCardSkillGroup>()
  for (const tag of tags) {
    const name = tag.name?.trim()
    if (!name) continue
    const level = tag.level?.trim() || 'Skills'
    let group = byLevel.get(level)
    if (!group) {
      group = {
        id: `sk_${level.replace(/\s+/g, '_').toLowerCase()}_${tag.id || Date.now()}`,
        type: level === 'Skills' ? '' : level,
        skills: [],
      }
      byLevel.set(level, group)
    }
    if (!group.skills.includes(name)) group.skills.push(name)
  }
  return Array.from(byLevel.values())
}
