/// <reference types="vitest/globals" />

import { contentGridClass } from './contentGridClass'

function classSet(result: string) {
  return new Set(result.split(/\s+/).filter(Boolean))
}

describe('contentGridClass', () => {
  it('returns base only when count is 1', () => {
    const result = classSet(contentGridClass(1, 'md:grid-cols-2 lg:grid-cols-3'))
    expect(result.has('grid')).toBe(true)
    expect(result.has('grid-cols-1')).toBe(true)
    expect(result.has('gap-4')).toBe(true)
    expect(result.has('md:grid-cols-2')).toBe(false)
    expect(result.has('lg:grid-cols-3')).toBe(false)
  })

  it('clamps a 3-col preset to 2 columns when count is 2', () => {
    const result = classSet(contentGridClass(2, 'md:grid-cols-2 lg:grid-cols-3'))
    expect(result.has('md:grid-cols-2')).toBe(true)
    expect(result.has('lg:grid-cols-2')).toBe(true)
    expect(result.has('lg:grid-cols-3')).toBe(false)
  })

  it('preserves the original preset when count meets or exceeds max columns', () => {
    const result = classSet(contentGridClass(3, 'md:grid-cols-2 lg:grid-cols-3'))
    expect(result.has('md:grid-cols-2')).toBe(true)
    expect(result.has('lg:grid-cols-3')).toBe(true)
  })

  it('clamps every breakpoint of a 4-col preset when count is 2', () => {
    const result = classSet(contentGridClass(2, 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'))
    expect(result.has('sm:grid-cols-2')).toBe(true)
    expect(result.has('lg:grid-cols-2')).toBe(true)
    expect(result.has('xl:grid-cols-2')).toBe(true)
    expect(result.has('lg:grid-cols-3')).toBe(false)
    expect(result.has('xl:grid-cols-4')).toBe(false)
  })

  it('clamps only breakpoints above count for a 4-col preset when count is 3', () => {
    const result = classSet(contentGridClass(3, 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'))
    expect(result.has('sm:grid-cols-2')).toBe(true)
    expect(result.has('lg:grid-cols-3')).toBe(true)
    expect(result.has('xl:grid-cols-3')).toBe(true)
    expect(result.has('xl:grid-cols-4')).toBe(false)
  })

  it('returns base only when multiColWhenMany is empty', () => {
    const result = classSet(contentGridClass(4, ''))
    expect(result.has('grid')).toBe(true)
    expect(result.has('grid-cols-1')).toBe(true)
    expect(result.has('gap-4')).toBe(true)
    expect(result.has('md:grid-cols-2')).toBe(false)
  })

  it('omits bare grid-cols when count is 1 and keeps it when count >= 2', () => {
    const single = classSet(contentGridClass(1, 'grid-cols-2', 'grid grid-cols-1 gap-3'))
    expect(single.has('grid-cols-1')).toBe(true)
    expect(single.has('gap-3')).toBe(true)
    expect(single.has('grid-cols-2')).toBe(false)

    const many = classSet(contentGridClass(2, 'grid-cols-2', 'grid grid-cols-1 gap-3'))
    expect(many.has('grid-cols-2')).toBe(true)
    expect(many.has('gap-3')).toBe(true)
  })
})
