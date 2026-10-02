import { describe, expect, it } from 'vitest'

import { normalizeVideoExplainerResponse } from './mapVideoExplainer'

describe('normalizeVideoExplainerResponse', () => {
  it('returns empty result when success and data is null', () => {
    expect(
      normalizeVideoExplainerResponse({
        success: true,
        data: null,
        post_type: { name: '2D Video Explainer', title: '2D Video Explainer' },
      })
    ).toEqual({
      sectionTitle: '2D Video Explainer',
      videoUrl: '',
      videoName: '',
      externalUrl: null,
    })
  })

  it('throws when success is false', () => {
    expect(() =>
      normalizeVideoExplainerResponse({
        success: false,
        data: null,
        error: 'profile_id is required',
      })
    ).toThrow(/profile_id is required/)
  })

  it('maps video and external url from payload', () => {
    const result = normalizeVideoExplainerResponse({
      success: true,
      data: {
        type: '2D Video Explainer',
        video: { doc_name: 'Demo', url: 'https://cdn.example.com/explainer.mp4' },
        external_url: { url: 'https://youtu.be/abc', has_external_url: true },
      },
    })
    expect(result.sectionTitle).toBe('2D Video Explainer')
    expect(result.videoUrl).toBe('https://cdn.example.com/explainer.mp4')
    expect(result.videoName).toBe('Demo')
    expect(result.externalUrl).toBe('https://youtu.be/abc')
  })
})
