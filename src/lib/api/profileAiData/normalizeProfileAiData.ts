import type {
  ProfileAiCustomSection,
  ProfileAiData,
  ProfileAiEducation,
  ProfileAiExperience,
  ProfileAiPortfolio,
  ProfileAiService,
  ProfileAiSkillGroup,
  ProfileAiSocials,
} from '@/interfaces/api/profileAiData'

type LooseRecord = Record<string, unknown>

function asRecord(value: unknown): LooseRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as LooseRecord
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const s = asString(value).trim()
  return s || null
}

function formatLooseDate(value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value === 'string') {
    // ISO datetime → YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
    return value
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  return asString(value)
}

function formatLooseDateOrNull(value: unknown): string | null {
  const formatted = formatLooseDate(value)
  return formatted || null
}

function asCurrentStatus(value: unknown, tillNow?: unknown): number {
  if (tillNow === true || tillNow === 1 || tillNow === '1') return 1
  if (value === true || value === 1 || value === '1') return 1
  if (typeof value === 'number') return value ? 1 : 0
  return 0
}

function normalizeSocials(raw: unknown): ProfileAiSocials {
  const s = asRecord(raw) ?? {}
  return {
    facebook: asNullableString(s.facebook),
    instagram: asNullableString(s.instagram),
    twitter: asNullableString(s.twitter),
    linkedin: asNullableString(s.linkedin),
    youtube: asNullableString(s.youtube),
    tiktok: asNullableString(s.tiktok),
    rumble: asNullableString(s.rumble),
    truth: asNullableString(s.truth),
  }
}

function normalizeSkills(raw: unknown): ProfileAiSkillGroup[] {
  if (!Array.isArray(raw)) return []

  const byCategory = new Map<string, string[]>()
  const order: string[] = []

  const pushSkill = (category: string, name: string) => {
    const skill = name.trim()
    if (!skill) return
    const key = category.trim()
    let list = byCategory.get(key)
    if (!list) {
      list = []
      byCategory.set(key, list)
      order.push(key)
    }
    if (!list.includes(skill)) list.push(skill)
  }

  for (const item of raw) {
    if (typeof item === 'string') {
      pushSkill('', item)
      continue
    }
    const rec = asRecord(item)
    if (!rec) continue

    // Already grouped: { category|type|level, skills: string[] }
    if (Array.isArray(rec.skills)) {
      const category = asString(rec.category ?? rec.type ?? rec.level).trim()
      for (const skill of rec.skills) {
        if (typeof skill === 'string') pushSkill(category, skill)
        else {
          const nested = asRecord(skill)
          if (nested) pushSkill(category, asString(nested.name || nested.title || nested.skill))
        }
      }
      continue
    }

    const name = asString(rec.name || rec.title || rec.skill).trim()
    if (!name) continue
    const category = asString(rec.level ?? rec.category ?? rec.type).trim()
    pushSkill(category, name)
  }

  return order
    .map((category) => ({
      category,
      skills: byCategory.get(category) || [],
    }))
    .filter((group) => group.skills.length > 0)
}

function normalizeEducation(raw: unknown): ProfileAiEducation[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      const e = asRecord(item)
      if (!e) return null
      const title = asString(e.title || e.degree).trim()
      const institute = asString(e.institute || e.institution || e.school).trim()
      return {
        title,
        institute,
        from_date: formatLooseDate(e.from_date ?? e.fromDate),
        to_date: formatLooseDateOrNull(e.to_date ?? e.toDate),
        current_status: asCurrentStatus(e.current_status ?? e.currentStatus, e.tillNow),
      } satisfies ProfileAiEducation
    })
    .filter((e): e is ProfileAiEducation => Boolean(e && (e.institute || e.title)))
}

function normalizeExperience(raw: unknown): ProfileAiExperience[] {
  if (!Array.isArray(raw)) return []
  const result: ProfileAiExperience[] = []
  for (const item of raw) {
    const e = asRecord(item)
    if (!e) continue
    const jobTitle = asString(e.job_title ?? e.jobTitle ?? e.title).trim()
    const company = asString(e.company).trim()
    if (!company && !jobTitle) continue
    result.push({
      title: jobTitle || undefined,
      company: company || undefined,
      job_title: jobTitle || undefined,
      description: asString(e.description) || undefined,
      from_date: formatLooseDate(e.from_date ?? e.fromDate) || undefined,
      to_date: formatLooseDateOrNull(e.to_date ?? e.toDate),
      current_status: asCurrentStatus(e.current_status ?? e.currentStatus, e.tillNow),
    })
  }
  return result
}

function normalizeServices(raw: unknown): ProfileAiService[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      const s = asRecord(item)
      if (!s) return null
      return {
        title: asString(s.title).trim(),
        description: asString(s.description),
      } satisfies ProfileAiService
    })
    .filter((s): s is ProfileAiService => Boolean(s && s.title))
}

function normalizePortfolio(raw: unknown): ProfileAiPortfolio[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      const p = asRecord(item)
      if (!p) return null
      return {
        title: asString(p.title).trim(),
        description: asString(p.description),
        url: asNullableString(p.url),
        status: typeof p.status === 'number' ? p.status : Number(p.status) || 1,
      } satisfies ProfileAiPortfolio
    })
    .filter((p): p is ProfileAiPortfolio => Boolean(p && p.title))
}

function normalizeCustomSections(raw: unknown): ProfileAiCustomSection[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      const c = asRecord(item)
      if (!c) return null
      return {
        section: asString(c.section),
        title: asString(c.title),
        summary: asString(c.summary),
        content: asString(c.content),
        date: asString(c.date),
      } satisfies ProfileAiCustomSection
    })
    .filter((c): c is ProfileAiCustomSection => Boolean(c))
}

function normalizeUnknownList(raw: unknown): unknown[] {
  return Array.isArray(raw) ? raw.slice(0, 100) : []
}

function normalizeAssistantContext(data: LooseRecord): ProfileAiData['assistantContext'] {
  const context = asRecord(data.assistantContext ?? data.assistant_context) ?? {}
  const rawKnowledge = context.knowledge ?? context.knowledgeText ?? context.knowledge_text ?? data.knowledge
  const knowledge = Array.isArray(rawKnowledge)
    ? rawKnowledge
        .map((item) => {
          if (typeof item === 'string') return item.trim()
          const row = asRecord(item)
          return row ? asString(row.content ?? row.text ?? row.summary).trim() : ''
        })
        .filter(Boolean)
        .slice(0, 50)
    : typeof rawKnowledge === 'string' && rawKnowledge.trim()
      ? [rawKnowledge.trim()]
      : []
  return {
    businessBrief: asString(
      context.businessBrief ??
        context.business_brief ??
        context.businessText ??
        data.businessBrief ??
        data.business_brief
    ),
    knowledge,
  }
}

/**
 * Normalizes Laravel snake_case and Node camelCase `/profile-ai-data` payloads
 * into the frontend `ProfileAiData` shape used by Education/Experience/Skills/Live Agent.
 */
export function normalizeProfileAiData(raw: unknown): ProfileAiData | null {
  const outer = asRecord(raw)
  if (!outer) return null

  // Support both raw AI payload and `{ success, data }` envelopes.
  const nested = asRecord(outer.data)
  const data =
    nested && (nested.slug != null || nested.ownerName != null || nested.education != null || nested.skills != null)
      ? nested
      : outer

  return {
    profileId: asString(data.profileId ?? data.profile_id ?? data.id),
    slug: asString(data.slug),
    ownerName: asString(data.ownerName || data.owner_name || data.name),
    title: asString(data.title || data.designation),
    profession: asNullableString(data.profession),
    company: asString(data.company || data.companyName || data.company_name),
    email: asString(data.email),
    phone: asString(data.phone),
    whatsapp: asString(data.whatsapp),
    website: asString(data.website),
    location: asString(data.location || data.address),
    about: asString(data.about),
    socials: normalizeSocials(data.socials),
    skills: normalizeSkills(data.skills),
    services: normalizeServices(data.services),
    experience: normalizeExperience(data.experience || data.experiences),
    education: normalizeEducation(data.education),
    portfolio: normalizePortfolio(data.portfolio || data.portfolios),
    customSections: normalizeCustomSections(data.customSections || data.custom_sections),
    reviews: normalizeUnknownList(data.reviews),
    blogs: normalizeUnknownList(data.blogs || data.posts),
    faqs: normalizeUnknownList(data.faqs),
    assistantContext: normalizeAssistantContext(data),
  }
}
