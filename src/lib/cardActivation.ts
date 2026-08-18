import type { VCardData } from '@/types/vcard'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type CardActivationProblem = {
  field: 'slug' | 'name' | 'email' | 'dob' | 'phone'
  label: string
  reason: 'missing' | 'invalid'
}

export function collectVCardActivationProblems(data: Pick<VCardData, 'slug' | 'personal'>): CardActivationProblem[] {
  const values = {
    slug: data.slug?.trim() || '',
    name: data.personal.fullName?.trim() || '',
    email: data.personal.email?.trim() || '',
    dob: data.personal.dob?.trim() || '',
    phone: data.personal.phone?.trim() || '',
  }
  const required: Array<[CardActivationProblem['field'], string]> = [
    ['slug', 'URL slug'],
    ['name', 'Name'],
    ['email', 'Email'],
    ['dob', 'Date of birth'],
    ['phone', 'Phone'],
  ]
  const problems: CardActivationProblem[] = required
    .filter(([field]) => !values[field])
    .map(([field, label]) => ({ field, label, reason: 'missing' as const }))

  if (values.email && !EMAIL_PATTERN.test(values.email)) {
    problems.push({ field: 'email', label: 'Email', reason: 'invalid' })
  }
  const phoneDigits = values.phone.replace(/\D/g, '')
  if (values.phone && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
    problems.push({ field: 'phone', label: 'Phone', reason: 'invalid' })
  }
  if (values.dob) {
    const parsed = new Date(`${values.dob}T00:00:00.000Z`)
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(values.dob) ||
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== values.dob ||
      parsed.getTime() > Date.now()
    ) {
      problems.push({ field: 'dob', label: 'Date of birth', reason: 'invalid' })
    }
  }
  return problems
}

export function vCardActivationProblemMessage(problems: CardActivationProblem[]): string {
  const missing = problems.filter((problem) => problem.reason === 'missing').map((problem) => problem.label)
  const invalid = problems.filter((problem) => problem.reason === 'invalid').map((problem) => problem.label)
  const parts: string[] = []
  if (missing.length) parts.push(`complete ${missing.join(', ')}`)
  if (invalid.length) parts.push(`correct ${invalid.join(', ')}`)
  return `Card cannot be activated. Please ${parts.join(' and ')}.`
}
