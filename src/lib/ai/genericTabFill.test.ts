import { describe, expect, it } from 'vitest'
import { countFillPayloadEntries } from './applyCardDraft'
import {
  entriesToCerts,
  entriesToCustomTabItems,
  entriesToSectionPosts,
  localContentFromText,
  mapContentFromPayload,
  mapEducationFromPayload,
  mapEntriesFromPayload,
  mapExperienceFromPayload,
  mapSkillsFromPayload,
} from './genericTabFill'

const eventsPayload = {
  entries: [
    {
      title: 'Spring Gala',
      description: 'Annual fundraising dinner.',
      date: '2026-04-12',
      location: 'Hartford, CT',
      price: '$75',
      url: 'https://example.com/gala',
      imageUrl: 'https://cdn.example.com/gala.jpg',
    },
    { title: 'Open House', description: '<p>Tour the new office.</p>' },
    { title: '', description: '' },
  ],
}

describe('mapEntriesFromPayload', () => {
  it('keeps every real entry, wraps plain text as HTML and skips empty rows', () => {
    const entries = mapEntriesFromPayload(eventsPayload)
    expect(entries).toHaveLength(2)
    expect(entries[0]).toMatchObject({ title: 'Spring Gala', date: '2026-04-12', location: 'Hartford, CT' })
    expect(entries[0]?.description).toBe('<p>Annual fundraising dinner.</p>')
    expect(entries[1]?.description).toBe('<p>Tour the new office.</p>')
    expect(countFillPayloadEntries('entries', eventsPayload)).toBe(2)
  })

  it('returns nothing for a payload without entries', () => {
    expect(mapEntriesFromPayload({})).toEqual([])
  })
})

describe('entriesToSectionPosts', () => {
  it("fills only the fields the tab's schema shows", () => {
    const entries = mapEntriesFromPayload(eventsPayload)
    const [withDate] = entriesToSectionPosts(entries, [
      'title',
      'description',
      'date',
      'url',
      'featuredImage',
      'active',
    ])
    expect(withDate).toMatchObject({
      title: 'Spring Gala',
      date: '2026-04-12',
      url: 'https://example.com/gala',
      featuredImage: 'https://cdn.example.com/gala.jpg',
      price: '',
      location: '',
      active: true,
    })
    expect(withDate?.id).toMatch(/^sec_/)

    const [noDate] = entriesToSectionPosts(entries, ['title', 'description', 'active'])
    expect(noDate?.date).toBe('')
    expect(noDate?.url).toBe('')
  })
})

describe('other list mappers', () => {
  it('maps entries to custom tab items and certificates', () => {
    const entries = mapEntriesFromPayload({
      entries: [{ title: 'Licensed Agent', subtitle: 'State of CT', date: '2021', description: 'Life and health.' }],
    })
    expect(entriesToCustomTabItems(entries)[0]).toMatchObject({ title: 'Licensed Agent', active: true, mediaUrl: '' })
    expect(entriesToCerts(entries)[0]).toMatchObject({
      name: 'Licensed Agent',
      issuer: 'State of CT',
      year: '2021',
      documents: [],
    })
  })

  it('maps education and experience, dropping empty rows', () => {
    expect(
      mapEducationFromPayload({ education: [{ institute: 'UConn', degree: 'BS Finance' }, { institute: '' }] })
    ).toHaveLength(1)
    const [job] = mapExperienceFromPayload({
      experience: [{ company: 'Black Swan', jobTitle: 'Agent', description: 'Advised families.' }],
    })
    expect(job).toMatchObject({ company: 'Black Swan', description: '<p>Advised families.</p>' })
  })

  it('never caps a pasted skills list and skips skills already listed', () => {
    const many = Array.from({ length: 12 }, (_, i) => `Skill ${i + 1}`)
    const groups = mapSkillsFromPayload({ skills: [{ type: 'Core', skills: many }] })
    expect(groups[0]?.skills).toHaveLength(12)

    const deduped = mapSkillsFromPayload({ skills: [{ type: 'Core', skills: ['SEO', 'Design'] }] }, [
      { id: 'a', type: 'Old', skills: ['seo'] },
    ])
    expect(deduped[0]?.skills).toEqual(['Design'])
  })
})

describe('single content block', () => {
  it('maps AI content and counts it as one', () => {
    const payload = { content: { title: 'Our Mission', description: 'We help families plan.' } }
    expect(mapContentFromPayload(payload)).toEqual({
      title: 'Our Mission',
      description: '<p>We help families plan.</p>',
    })
    expect(countFillPayloadEntries('content', payload)).toBe(1)
    expect(mapContentFromPayload({ content: { title: '', description: '' } })).toBeNull()
    expect(countFillPayloadEntries('content', {})).toBe(0)
  })

  it('local fallback uses a short first line as the heading', () => {
    expect(localContentFromText('Our Mission\nWe help families.\n\nEvery day.')).toEqual({
      title: 'Our Mission',
      description: '<p>We help families.</p><p>Every day.</p>',
    })
    // A sentence on its own is all body, no heading.
    expect(localContentFromText('We help families plan their future.')).toEqual({
      title: '',
      description: '<p>We help families plan their future.</p>',
    })
    expect(localContentFromText('   ')).toBeNull()
  })
})
