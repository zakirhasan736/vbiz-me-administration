export type TourKey = 'dashboard' | 'create_card'

export const TOUR_STORAGE_PREFIX = 'vbiz_tour_v3_'
/** Legacy uid-scoped keys from the old unified dashboard tour */
export const LEGACY_DASHBOARD_TOUR_PREFIX = 'vbiz_dashboard_tour_v3_'

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center'

export type EditorTourAssist = {
  settingsOpen?: boolean
  settingsTab?: string
  activeNavId?: string
}

export type SettingsTourAssist = {
  activeTab?: string
}

export type DashboardTourStep = {
  id: string
  title: string
  description: string
  tips?: string[]
  /**
   * Highlight target. Prefer CSS selectors like `[data-tour='dash-header']`,
   * or a bare id / data-tour-id token (resolved to `#id` / `[data-tour-id]` / `[data-tour]`).
   */
  target?: string
  /** Pathname the step belongs to. Omit for steps valid on any dashboard route. */
  route?: string
  placement?: TourPlacement
  nextNavigate?: string
  editorAssist?: EditorTourAssist
  settingsAssist?: SettingsTourAssist
  openMobileNav?: boolean
  scrollTarget?: boolean
  /** Switch create-card editor to this tab before highlighting */
  activateTab?: string
}

/** Backoffice-matched dashboard tour (vcard-owner Overview). */
export const DASHBOARD_TOUR_STEPS: DashboardTourStep[] = [
  {
    id: 'welcome',
    route: '/',
    placement: 'center',
    title: 'Welcome to your dashboard',
    description:
      'This is your home base after login. You’ll see performance, exports, and shortcuts to edit your vCard — everything starts here.',
    tips: [
      'New accounts get this tour once; use “Start tour” anytime to replay.',
      'Corporate owners also see a team directory from the sidebar.',
    ],
  },
  {
    id: 'overview',
    route: '/',
    target: "[data-tour='dash-header']",
    placement: 'bottom',
    title: 'Overview header',
    description:
      'The Overview block introduces your personal vCard workspace. It confirms you’re looking at live engagement for your public card.',
    tips: [
      'Change the date range to focus Last 7 / 30 / 90 days.',
      'Your display name and slug appear in related summary cards below.',
    ],
  },
  {
    id: 'actions',
    route: '/',
    target: "[data-tour='dash-actions']",
    placement: 'bottom',
    title: 'Header actions',
    description:
      'These buttons sit next to the Overview title. Use them without leaving the page: export a CSV report, send product feedback, or open support.',
    tips: [
      'Export downloads a simple metrics CSV for sharing or bookkeeping.',
      'Feedback / Support messages go to your admin inbox in demo mode.',
    ],
  },
  {
    id: 'metrics',
    route: '/',
    target: "[data-tour='dash-metrics']",
    placement: 'top',
    title: 'Performance metrics',
    description:
      'These cards show how people interact with your public card — views, saves, and trend charts. Numbers update as visitors open your link.',
    tips: [
      'Views = page opens; Saves = contact downloads / lead captures.',
      'Charts help you spot quiet vs busy weeks at a glance.',
    ],
    scrollTarget: true,
  },
  {
    id: 'next',
    route: '/',
    placement: 'center',
    title: 'What to do next',
    description:
      'When you’re ready to improve the card itself, open Create / Edit vCard from the sidebar or card actions. The create-card screen has its own guided tour for tabs, Add, AI fill, and more.',
    tips: [
      'Complete Personal info first — it powers Call / Email on My Info.',
      'Replay this dashboard tour anytime from the “Take a tour” card at the top.',
    ],
  },
]

/** Backoffice-matched create-card tour. */
export const CREATE_CARD_TOUR_STEPS: DashboardTourStep[] = [
  {
    id: 'welcome',
    placement: 'center',
    title: 'Creating your vCard',
    description:
      'This is your build workspace. Every tab becomes a section on the public card. We’ll walk through progress, tabs, AI tools, and the main content areas new owners use most.',
    tips: [
      'You can Skip anytime and replay from “Take a tour” at the top.',
      'Tab order you set here is what visitors see on the public frontend.',
    ],
  },
  {
    id: 'complete',
    target: "[data-tour='card-complete']",
    placement: 'bottom',
    title: 'Card complete progress',
    description:
      'This bar averages completion across enabled tabs. Empty forms stay at 0%. Only real field data raises the %. Aim high before sharing your public link.',
    tips: [
      'Services need title + description (and type for full score).',
      'Portfolio needs title, description, and media for 100%.',
      'Personal phone / email also power Call & Email on My Info.',
    ],
    scrollTarget: true,
  },
  {
    id: 'tabs',
    target: "[data-tour='tabs-bar']",
    placement: 'bottom',
    title: 'Tabs bar',
    description:
      'Each pill is a section — Personal, Education, Experience, Skill, Services, Portfolio, and more. The active tab is highlighted; neighbors stay lightly visible so you always see what’s next.',
    tips: [
      'Drag or swipe the strip to browse many tabs.',
      '“N prev” / “N next” jump by a few tabs when some are off-screen.',
    ],
  },
  {
    id: 'add',
    target: "[data-tour='add-tabs']",
    placement: 'bottom',
    title: '+ Add — enable & reorder',
    description:
      'Open Add to turn sections on or off and set Tab order (3-column grid). Drag or use ↑↓ to reorder, then Apply.',
    tips: ['Personal stays required.', 'Global Connection & My Info stay pinned near the end by default.'],
  },
  {
    id: 'generate',
    target: "[data-tour='ai-generate']",
    placement: 'bottom',
    title: 'AI Generate (website → card)',
    description:
      'Generate opens AI Auto-Creation. Paste a company or personal website URL and the AI drafts profile fields so you start from content instead of a blank form.',
    tips: [
      'Best when you already have a live site or LinkedIn-style page.',
      'Always review and edit AI output — treat it as a first draft.',
      'Use this for bulk profile kickoff; use AI Auto-fill inside tabs for lists.',
    ],
  },
  {
    id: 'settings-gear',
    target: "[data-tour='tabs-actions']",
    placement: 'bottom',
    title: 'Settings gear',
    description:
      'The gear opens card-wide Settings — theme, visibility, and the full nav catalog. It’s separate from the section tabs you’re editing day to day.',
    tips: ['Use Settings for global look & feel; use Add for quick tab enable/order.'],
  },
  {
    id: 'personal',
    target: "[data-tour='tab-form']",
    placement: 'top',
    title: 'Personal — start here',
    description:
      'Personal is your identity block: name, role, photo, phone, WhatsApp, email, and location. Visitors and My Info Call/Text/Email all depend on this tab.',
    tips: [
      'Fill contact fields early so later tabs (My Info) light up correctly.',
      'A clear photo and short headline help first impressions.',
    ],
    activateTab: 'Personal',
    scrollTarget: true,
  },
  {
    id: 'education',
    target: "[data-tour='tab-form']",
    placement: 'top',
    title: 'Education',
    description:
      'Add schools, degrees, and years. Useful for professionals, consultants, and anyone who wants credentials visible on the public card.',
    tips: ['Leave empty if not relevant — disable the tab in Add instead of faking data.'],
    activateTab: 'Education',
    scrollTarget: true,
  },
  {
    id: 'experience',
    target: "[data-tour='tab-form']",
    placement: 'top',
    title: 'Experience',
    description:
      'List roles, companies, and what you did. This reads like a short résumé timeline on your public card.',
    tips: ['Start with your current role; keep descriptions short and outcome-focused.'],
    activateTab: 'Experience',
    scrollTarget: true,
  },
  {
    id: 'skill',
    target: "[data-tour='tab-form']",
    placement: 'top',
    title: 'Skill',
    description:
      'Skills show what you’re known for — tools, languages, specialties. Keep the list focused so visitors scan quickly.',
    tips: ['Group related skills if the form allows categories.', 'Prefer 6–12 strong skills over a very long list.'],
    activateTab: 'Skill',
    scrollTarget: true,
  },
  {
    id: 'services',
    target: "[data-tour='tab-form']",
    placement: 'top',
    title: 'Services',
    description:
      'Services is what you sell or offer. Each entry needs a clear title and description (and type when available) so Card complete can reach 100%.',
    tips: [
      'Add multiple services — reorder with grip / arrows.',
      'Use AI Auto-fill below to paste a services list from a doc.',
    ],
    activateTab: 'Services',
    scrollTarget: true,
  },
  {
    id: 'ai-autofill-services',
    target: "[data-tour='ai-autofill']",
    placement: 'top',
    title: 'AI Auto-fill (lists)',
    description:
      'On multi-entry tabs, AI Auto-fill lets you drop a .txt/.md file or paste text. Separate items with a blank line or --- and the editor fills titles and details into entries.',
    tips: [
      'Example block: first line = title, next lines = description.',
      'Also available on Portfolio, Reviews, and News/Blogs.',
      'This is different from the green Generate button (website scrape).',
    ],
    activateTab: 'Services',
    scrollTarget: true,
  },
  {
    id: 'jump-pills',
    target: "[data-tour='tab-form']",
    placement: 'top',
    title: 'Jump pills',
    description:
      'When you have several entries, jump pills appear under the banner (a few per row). Tap one to scroll straight to that item — no endless scrolling.',
    tips: ['Pills show after you have 2+ entries. Add a second service to see them.'],
    activateTab: 'Services',
    scrollTarget: true,
  },
  {
    id: 'portfolio',
    target: "[data-tour='tab-form']",
    placement: 'top',
    title: 'Portfolio',
    description:
      'Portfolio showcases projects or case studies. For full completion, each item needs title, description, and media (image or link).',
    tips: ['Lead with your best work first — reorder anytime.', 'AI Auto-fill works here the same way as Services.'],
    activateTab: 'Portfolio',
    scrollTarget: true,
  },
  {
    id: 'reviews',
    target: "[data-tour='tab-form']",
    placement: 'top',
    title: 'Reviews',
    description:
      'Collect testimonials — client name, quote, and optional rating. Social proof makes your public card more trustworthy.',
    tips: ['Short quotes work better than long paragraphs.'],
    activateTab: 'Reviews',
    scrollTarget: true,
  },
  {
    id: 'news',
    target: "[data-tour='tab-form']",
    placement: 'top',
    title: 'News / Blogs',
    description:
      'Share updates, posts, or links to articles. Great for thought leadership and keeping the card feeling current.',
    tips: ['Link out to your blog or LinkedIn posts when you don’t host full articles here.'],
    activateTab: 'News/Blogs',
    scrollTarget: true,
  },
  {
    id: 'profile',
    target: "[data-tour='tab-form']",
    placement: 'top',
    title: 'Profile',
    description:
      'Profile holds richer about / bio style content that complements Personal. Use it for a longer story visitors can read.',
    tips: ['Keep Personal short; put the longer narrative here.'],
    activateTab: 'Profile',
    scrollTarget: true,
  },
  {
    id: 'certs',
    target: "[data-tour='tab-form']",
    placement: 'top',
    title: 'Certifications / Licenses',
    description:
      'Upload certificates or licenses (image, PDF, or document). Shows visitors you’re credentialed in your field.',
    tips: ['Prefer clear scans or official PDFs.'],
    activateTab: 'Certifications/Licenses',
    scrollTarget: true,
  },
  {
    id: 'resume',
    target: "[data-tour='tab-form']",
    placement: 'top',
    title: 'Resume',
    description: 'Upload a résumé or CV document so interested visitors can download your full background in one file.',
    tips: ['Keep one current file; replace it when your experience changes.'],
    activateTab: 'Resume',
    scrollTarget: true,
  },
  {
    id: 'content-media',
    target: "[data-tour='tab-form']",
    placement: 'top',
    title: 'Content & media',
    description:
      'Extra media and content blocks for the card — galleries, embeds, or supporting assets depending on your template.',
    tips: ['Use this after core Personal / Services / Portfolio are solid.'],
    activateTab: 'Content & media',
    scrollTarget: true,
  },
  {
    id: 'global',
    target: "[data-tour='tab-form']",
    placement: 'top',
    title: 'Global Connection',
    description:
      'A shared network directory section on the public card. Same connection experience for owners — great for discovery across the platform.',
    tips: ['Usually kept near the end of the tab order.'],
    activateTab: 'Global Connection',
    scrollTarget: true,
  },
  {
    id: 'myinfo',
    target: "[data-tour='tab-form']",
    placement: 'top',
    title: 'My Info — Call / Text / Email',
    description:
      'My Info controls the contact dock visitors use: Call, Text (WhatsApp), and Email. Labels are editable here; numbers/addresses come from Personal.',
    tips: [
      'Without phone/email in Personal, buttons won’t work for visitors.',
      'Customize button labels to match your brand tone.',
    ],
    activateTab: 'My Info',
    scrollTarget: true,
  },
  {
    id: 'workflow',
    placement: 'center',
    title: 'Suggested workflow',
    description:
      'A smooth path for new users: Personal → Skill → Services → Portfolio → My Info → then Education/Experience/Reviews as needed. Watch Card complete rise as you go.',
    tips: [
      'Use Generate once if you have a website.',
      'Use AI Auto-fill inside list tabs to save typing.',
      'Disable tabs you don’t need via Add so progress stays honest.',
    ],
  },
  {
    id: 'done',
    placement: 'center',
    title: 'You’re ready',
    description:
      'Save often, preview the public card, then share your slug when Card complete looks good. Replay this tour anytime from the invite card at the top.',
    tips: [
      'Green Generate = website AI draft. Purple AI Auto-fill = paste/drop into list tabs.',
      'Add unlocks Events and other optional sections when you need them.',
    ],
  },
]

export function getTourSteps(key: TourKey): DashboardTourStep[] {
  return key === 'create_card' ? CREATE_CARD_TOUR_STEPS : DASHBOARD_TOUR_STEPS
}

export function getTourStorageKey(tourKey: TourKey) {
  return `${TOUR_STORAGE_PREFIX}${tourKey}`
}

function migrateLegacyDashboardDone(uid?: string | null): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (uid) {
      const legacy = localStorage.getItem(`${LEGACY_DASHBOARD_TOUR_PREFIX}${uid}`)
      if (legacy === 'completed') {
        markTourDone('dashboard')
        return true
      }
    }
  } catch {
    /* ignore */
  }
  return false
}

export function isTourCompleted(tourKey: TourKey, uid?: string | null): boolean {
  if (typeof window === 'undefined') return true
  try {
    if (localStorage.getItem(getTourStorageKey(tourKey)) === '1') return true
    if (tourKey === 'dashboard' && migrateLegacyDashboardDone(uid)) return true
  } catch {
    /* ignore */
  }
  return false
}

export function markTourDone(tourKey: TourKey) {
  try {
    localStorage.setItem(getTourStorageKey(tourKey), '1')
    localStorage.setItem(`vbiz_tour_v2_${tourKey}`, '1')
    localStorage.setItem(`vbiz_tour_${tourKey}`, '1')
  } catch {
    /* ignore */
  }
}

/** @deprecated Use markTourDone('dashboard') */
export function markTourCompleted(_uid?: string) {
  void _uid
  markTourDone('dashboard')
}

export function getTourBannerDismissKey(tourKey: TourKey, uid: string) {
  return `${TOUR_STORAGE_PREFIX}banner_dismiss_${tourKey}_${uid}`
}

function getLegacyTourBannerDismissKey(uid: string) {
  return `${LEGACY_DASHBOARD_TOUR_PREFIX}banner_dismiss_${uid}`
}

export function isTourBannerDismissed(tourKey: TourKey, uid: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (localStorage.getItem(getTourBannerDismissKey(tourKey, uid)) === 'true') return true
    // Legacy dashboard-only dismiss key (pre per-tourKey)
    if (tourKey === 'dashboard' && localStorage.getItem(getLegacyTourBannerDismissKey(uid)) === 'true') {
      return true
    }
  } catch {
    /* ignore */
  }
  return false
}

export function dismissTourBanner(tourKey: TourKey, uid: string) {
  try {
    localStorage.setItem(getTourBannerDismissKey(tourKey, uid), 'true')
  } catch {
    /* ignore */
  }
}

export function clearTourBannerDismiss(tourKey: TourKey, uid: string) {
  try {
    localStorage.removeItem(getTourBannerDismissKey(tourKey, uid))
    if (tourKey === 'dashboard') {
      localStorage.removeItem(getLegacyTourBannerDismissKey(uid))
    }
  } catch {
    /* ignore */
  }
}

const TOUR_SETTINGS_SCOPE = '[data-tour-settings-scope]'

function isCssSelectorTarget(target: string): boolean {
  return target.includes('[') || target.includes('.') || target.includes('#') || target.includes(' ')
}

export function getTourTargetScope(targetId: string, route?: string): ParentNode | null {
  if (isCssSelectorTarget(targetId)) {
    if (targetId.includes('dash-')) return document
    if (route === '/settings' || targetId.includes('account-')) {
      return document.querySelector(TOUR_SETTINGS_SCOPE) ?? document
    }
    if (
      targetId.includes('card-') ||
      targetId.includes('tab-') ||
      targetId.includes('ai-') ||
      targetId.includes('add-') ||
      targetId.includes('tabs-')
    ) {
      return document.querySelector('[data-tour-editor-scope]') ?? document.getElementById('main-scroll') ?? document
    }
    return document
  }

  if (targetId.startsWith('tour-nav-')) {
    return document.querySelector('header') ?? document
  }

  if (targetId.startsWith('tour-account-') || route === '/settings') {
    return document.querySelector(TOUR_SETTINGS_SCOPE)
  }

  if (targetId.startsWith('tour-create-') || route === '/vcards') {
    return document.getElementById('main-scroll') ?? document
  }

  if (targetId.startsWith('tour-editor-') || targetId.startsWith('tour-card-') || route === '/vcards/create') {
    return document.querySelector('[data-tour-editor-scope]') ?? document.getElementById('main-scroll') ?? document
  }

  return document
}

function queryTourTargetNodes(target: string, scope: ParentNode): HTMLElement[] {
  const nodes: HTMLElement[] = []

  if (isCssSelectorTarget(target)) {
    try {
      nodes.push(...Array.from(scope.querySelectorAll<HTMLElement>(target)))
    } catch {
      /* invalid selector */
    }
    return nodes
  }

  const selectors = [`#${CSS.escape(target)}`, `[data-tour-id="${target}"]`, `[data-tour="${target}"]`]

  for (const selector of selectors) {
    nodes.push(...Array.from(scope.querySelectorAll<HTMLElement>(selector)))
  }

  return nodes
}

export function findTourTargetElement(targetId: string, route?: string): HTMLElement | null {
  const scope = getTourTargetScope(targetId, route)
  if (scope === null) return null

  const visible = findVisibleTourTarget(targetId, scope)
  if (visible) return visible

  for (const node of queryTourTargetNodes(targetId, scope)) {
    if (node.isConnected) return node
  }

  return null
}

export function findVisibleTourTarget(targetId: string, scope: ParentNode = document): HTMLElement | null {
  for (const node of queryTourTargetNodes(targetId, scope)) {
    if (isElementVisibleForTour(node)) return node
  }

  return null
}

export function findVisibleTourTargetForStep(step: DashboardTourStep): HTMLElement | null {
  if (!step.target) return null
  const scope = getTourTargetScope(step.target, step.route)
  if (scope === null) return null
  return findVisibleTourTarget(step.target, scope)
}

function isElementVisibleForTour(el: HTMLElement): boolean {
  const candidate = el.closest<HTMLElement>('a, button, [data-tour-id], [data-tour]') ?? el
  const rect = candidate.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return false

  let node: HTMLElement | null = candidate
  while (node) {
    const style = window.getComputedStyle(node)
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false
    }
    node = node.parentElement
  }

  return true
}

const HIGHLIGHT_ATTR = 'data-vbiz-tour-highlight'
const HEADER_BOOST_ATTR = 'data-vbiz-tour-header-boost'

export const TOUR_Z = {
  backdrop: 10000,
  headerBoost: 10001,
  spotlightRing: 10002,
  highlight: 10003,
  card: 10005,
} as const

export const TOUR_REMEASURE_EVENT = 'vbiz-tour-remeasure'

export const MOBILE_NAV_MAX_WIDTH = 1023

export function isMobileNavViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= MOBILE_NAV_MAX_WIDTH
}

export function requestTourRemeasure() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(TOUR_REMEASURE_EVENT))
}

export function setTourTargetHighlight(targetId: string | null | undefined, route?: string) {
  clearTourTargetHighlight()

  if (!targetId) return

  const scope = getTourTargetScope(targetId, route)
  if (scope === null) return

  const el = findVisibleTourTarget(targetId, scope)
  if (!el) return

  const highlightEl = el.closest<HTMLElement>('a, button') ?? el

  highlightEl.setAttribute(HIGHLIGHT_ATTR, 'true')
  if (window.getComputedStyle(highlightEl).position === 'static') {
    highlightEl.style.position = 'relative'
  }
  highlightEl.style.zIndex = String(TOUR_Z.highlight)

  const header = highlightEl.closest('header')
  if (header instanceof HTMLElement) {
    header.setAttribute(HEADER_BOOST_ATTR, 'true')
    header.style.position = 'sticky'
    header.style.zIndex = String(TOUR_Z.headerBoost)
  }
}

export function clearTourTargetHighlight() {
  document.querySelectorAll<HTMLElement>(`[${HIGHLIGHT_ATTR}]`).forEach((el) => {
    el.removeAttribute(HIGHLIGHT_ATTR)
    el.style.zIndex = ''
    el.style.position = ''
  })

  document.querySelectorAll<HTMLElement>(`[${HEADER_BOOST_ATTR}]`).forEach((header) => {
    header.removeAttribute(HEADER_BOOST_ATTR)
    header.style.zIndex = ''
    header.style.position = ''
  })
}

export function resolveTourRouteForStep(steps: DashboardTourStep[], stepIndex: number): string {
  for (let i = stepIndex; i >= 0; i--) {
    const route = steps[i]?.route
    if (route) return route
  }
  return '/'
}

export function resolveTourBackDestination(
  steps: DashboardTourStep[],
  stepIndex: number,
  pathname: string
): string | null {
  if (stepIndex <= 0) return null

  const prevIndex = stepIndex - 1
  const prevStep = steps[prevIndex]
  if (!prevStep) return null

  const prevRoute = resolveTourRouteForStep(steps, prevIndex)
  const prevStepForRoute = { ...prevStep, route: prevStep.route ?? prevRoute }

  if (!routeMatchesStep(pathname, prevStepForRoute)) {
    return prevRoute
  }

  return null
}

export function routeMatchesStep(pathname: string, step: DashboardTourStep): boolean {
  if (!step.route) return true
  if (step.route === '/') return pathname === '/'
  if (step.route === '/vcards') return pathname === '/vcards'
  if (step.route === '/vcards/create') {
    return pathname === '/vcards/create' || pathname.startsWith('/vcards/create/')
  }
  if (step.route === '/vcards/edit') {
    return pathname === '/vcards/edit' || pathname.startsWith('/vcards/edit/')
  }
  if (step.route === '/settings') {
    return pathname === '/settings' || pathname.startsWith('/settings/')
  }
  return pathname === step.route || pathname.startsWith(`${step.route}/`)
}

export function shouldScrollTourStep(step: DashboardTourStep): boolean {
  if (step.scrollTarget === false) return false
  if (step.scrollTarget === true) return true
  if (!step.target || step.placement === 'center') return false
  return (
    step.target.includes('tab-form') ||
    step.target.includes('ai-autofill') ||
    step.target.includes('card-complete') ||
    step.target.includes('dash-metrics') ||
    Boolean(step.activateTab)
  )
}

function getScrollableAncestors(el: HTMLElement): HTMLElement[] {
  const scrollables: HTMLElement[] = []
  let node: HTMLElement | null = el.parentElement

  while (node) {
    const style = window.getComputedStyle(node)
    const scrollableY = /(auto|scroll|overlay)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1
    const scrollableX = /(auto|scroll|overlay)/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 1
    if (scrollableY || scrollableX) {
      scrollables.push(node)
    }
    node = node.parentElement
  }

  const main = document.getElementById('main-scroll')
  if (main && main.scrollHeight > main.clientHeight + 1 && !scrollables.includes(main)) {
    scrollables.push(main)
  }

  return scrollables
}

let tourProgrammaticScroll = false

export function runWithTourProgrammaticScroll(fn: () => void) {
  tourProgrammaticScroll = true
  try {
    fn()
  } finally {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        tourProgrammaticScroll = false
      })
    })
  }
}

const TOUR_SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
])

function isTourUiEventTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('[data-vbiz-tour-ui]'))
}

export function attachTourScrollLock(): () => void {
  const prevent = (e: Event) => {
    if (tourProgrammaticScroll) return
    if (isTourUiEventTarget(e.target)) return

    if (e.type === 'keydown') {
      const ke = e as KeyboardEvent
      if (!TOUR_SCROLL_KEYS.has(ke.key)) return
      if (ke.ctrlKey || ke.metaKey || ke.altKey) return
      const target = ke.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return
      }
    }

    e.preventDefault()
  }

  const opts: AddEventListenerOptions = { capture: true, passive: false }
  document.addEventListener('wheel', prevent, opts)
  document.addEventListener('touchmove', prevent, opts)
  document.addEventListener('keydown', prevent, opts)

  return () => {
    document.removeEventListener('wheel', prevent, opts)
    document.removeEventListener('touchmove', prevent, opts)
    document.removeEventListener('keydown', prevent, opts)
  }
}

export function scrollTourTargetIntoView(targetId: string, route?: string): boolean {
  const el = findTourTargetElement(targetId, route)
  if (!el) return false

  let scrolled = false
  runWithTourProgrammaticScroll(() => {
    scrolled = scrollTourTargetIntoViewInner(el)
  })
  return scrolled
}

function scrollTourTargetIntoViewInner(el: HTMLElement): boolean {
  const viewportPad =
    window.innerWidth < 640 ? 72 : window.innerWidth < 1024 ? 96 : window.innerWidth < 1280 ? 112 : 128
  const tooltipPad = getTourTooltipViewportReserve()
  const margin = 16

  for (let pass = 0; pass < 3; pass += 1) {
    const scrollables = getScrollableAncestors(el)

    for (let i = scrollables.length - 1; i >= 0; i -= 1) {
      const container = scrollables[i]
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      const idealTop = containerRect.top + viewportPad
      const deltaY = elRect.top - idealTop

      if (Math.abs(deltaY) > 4) {
        container.scrollBy({ top: deltaY, behavior: 'instant' as ScrollBehavior })
      }

      const idealLeft = containerRect.left + margin
      const deltaX = elRect.left - idealLeft
      if (Math.abs(deltaX) > 4) {
        container.scrollBy({ left: deltaX, behavior: 'instant' as ScrollBehavior })
      }
    }

    const rect = el.getBoundingClientRect()
    if (rect.top >= viewportPad && rect.bottom <= window.innerHeight - tooltipPad) {
      break
    }
  }

  const rect = el.getBoundingClientRect()
  if (rect.top < viewportPad || rect.bottom > window.innerHeight - tooltipPad) {
    window.scrollTo({
      top: window.scrollY + rect.top - viewportPad,
      behavior: 'instant' as ScrollBehavior,
    })
  }

  return true
}

export function getTourTooltipViewportReserve(): number {
  return window.innerWidth < 640 ? 280 : 300
}
