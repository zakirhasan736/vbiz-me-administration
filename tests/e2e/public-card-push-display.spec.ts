import { expect, test } from '@playwright/test'

const REQUIRED_PUSH_MARKERS = [
  'meeting_alert',
  'viewer_return',
  'save_contact',
  'showNotification',
  'compatibleOptions',
]

test('shipped service worker can show push alerts on this browser', async ({ request }) => {
  const response = await request.get('/sw.js')
  expect(response.ok()).toBeTruthy()
  const source = await response.text()
  for (const marker of REQUIRED_PUSH_MARKERS) {
    expect(source, marker).toContain(marker)
  }
  expect(source).toContain('Safari on iPhone and Mac')
})
