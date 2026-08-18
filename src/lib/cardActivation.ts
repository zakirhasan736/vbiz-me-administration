import type { VCardData } from '@/types/vcard'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const MIN_CARD_AGE_YEARS = 12

export type CardActivationProblem = {
  field: 'slug' | 'name' | 'email' | 'dob' | 'phone'
  label: string
  reason: 'missing' | 'invalid' | 'underage'
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function localDateOnly(date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function minCardAgeCutoffDate(now = new Date()): string {
  return localDateOnly(new Date(now.getFullYear() - MIN_CARD_AGE_YEARS, now.getMonth(), now.getDate()))
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
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
    if (!isCalendarDate(values.dob) || values.dob > localDateOnly()) {
      problems.push({ field: 'dob', label: 'Date of birth', reason: 'invalid' })
    } else if (values.dob > minCardAgeCutoffDate()) {
      problems.push({ field: 'dob', label: 'Date of birth', reason: 'underage' })
    }
  }
  return problems
}

export function collectVCardCreationProblems(data: Pick<VCardData, 'personal'>): CardActivationProblem[] {
  const dob = data.personal.dob?.trim() || ''
  if (!dob) return [{ field: 'dob', label: 'Date of birth', reason: 'missing' }]
  if (!isCalendarDate(dob) || dob > localDateOnly()) {
    return [{ field: 'dob', label: 'Date of birth', reason: 'invalid' }]
  }
  if (dob > minCardAgeCutoffDate()) {
    return [{ field: 'dob', label: 'Date of birth', reason: 'underage' }]
  }
  return []
}

export function vCardCreationProblemMessage(problem: CardActivationProblem): string {
  if (problem.reason === 'missing') return 'Please enter a date of birth before creating the vCard.'
  if (problem.reason === 'underage') return 'You must be at least 12 years old to create a vCard.'
  return 'Please enter a valid date of birth before creating the vCard.'
}

export function vCardActivationProblemMessage(problems: CardActivationProblem[]): string {
  const missing = problems.filter((problem) => problem.reason === 'missing')
  const invalid = problems.filter((problem) => problem.reason === 'invalid')
  const underage = problems.some((problem) => problem.reason === 'underage')

  if (problems.length === 1 && missing.length === 1 && missing[0].field === 'dob') {
    return 'Card cannot be activated. Please enter your date of birth.'
  }

  const missingLabels = missing.map((problem) => problem.label)
  const invalidLabels = invalid.filter((problem) => problem.field !== 'dob').map((problem) => problem.label)
  const dobInvalid = invalid.some((problem) => problem.field === 'dob')

  const pleaseParts: string[] = []
  if (missingLabels.length) pleaseParts.push(`complete ${missingLabels.join(', ')}`)
  if (invalidLabels.length) pleaseParts.push(`correct ${invalidLabels.join(', ')}`)
  if (dobInvalid) pleaseParts.push('enter a valid date of birth')

  const sentences: string[] = []
  if (pleaseParts.length) sentences.push(`Please ${pleaseParts.join(' and ')}.`)
  if (underage) sentences.push('You must be at least 12 years old.')
  return `Card cannot be activated. ${sentences.join(' ')}`.trim()
}
