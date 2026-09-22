/**
 * iPhone sizes exercised by Playwright WebKit.
 * Physical checks that automation cannot finish: a real iPhone on iOS Safari,
 * Add to Home Screen (standalone), and an installed home-screen card after a
 * contact download. Use iPhone SE, a 13/14-class phone, and a Pro Max.
 */
export const IPHONE_E2E_DEVICES = [
  {
    project: 'iphone-se',
    device: 'iPhone SE (3rd gen)',
    covers: 'Smallest current iPhone Safari: narrow width, Home indicator, and touch targets.',
  },
  {
    project: 'iphone',
    device: 'iPhone 13',
    covers: 'Baseline iPhone for visitor flows, API responses, Safari checks, and the public route catalog.',
  },
  {
    project: 'iphone-17',
    device: 'iPhone 17 Pro Max',
    covers: 'Largest current iPhone: wide layout and Dynamic Island safe area.',
  },
] as const

export const IPHONE_E2E_FILES = [
  '**/public-card-visitor-flows.spec.ts',
  '**/public-card-api-responses.spec.ts',
  '**/iphone-*.spec.ts',
]
