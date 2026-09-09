import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { normalizeVideoExplainerResponse } from './mapVideoExplainer'

describe('normalizeVideoExplainerResponse', () => {
  it('returns empty result when success and data is null', () => {
    assert.deepEqual(
      normalizeVideoExplainerResponse({
        success: true,
        data: null,
        post_type: { name: '2D Video Explainer', title: '2D Video Explainer' },
      }),
      {
        sectionTitle: '2D Video Explainer',
        videoUrl: '',
        videoName: '',
        externalUrl: null,
      }
    )
  })

  it('throws when success is false', () => {
    assert.throws(
      () =>
        normalizeVideoExplainerResponse({
          success: false,
          data: null,
          error: 'profile_id is required',
        }),
      /profile_id is required/
    )
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
    assert.equal(result.sectionTitle, '2D Video Explainer')
    assert.equal(result.videoUrl, 'https://cdn.example.com/explainer.mp4')
    assert.equal(result.videoName, 'Demo')
    assert.equal(result.externalUrl, 'https://youtu.be/abc')
  })
})
