import type { VCardFaqEntry } from '@/types/vcard'

export function createDefaultFaqEntry(): VCardFaqEntry {
  return {
    id: `faq_${Date.now()}`,
    question: '',
    answer: '',
    active: true,
  }
}

export function normalizeFaqList(raw?: VCardFaqEntry[] | null): VCardFaqEntry[] {
  if (!raw?.length) return []
  return raw.map((entry) => ({
    id: entry.id || `faq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    question: entry.question ?? '',
    answer: entry.answer ?? '',
    active: entry.active !== false,
  }))
}

/** Active FAQs with a question and answer — shown on the public profile FAQ tab. */
export function getPublishedFaqs(entries: VCardFaqEntry[]): VCardFaqEntry[] {
  return entries.filter((e) => e.active && e.question.trim().length > 0 && e.answer.trim().length > 0)
}

/** Starter content when no FAQs are saved yet (demo / preview). */
export const DEFAULT_DEMO_FAQS: VCardFaqEntry[] = [
  {
    id: 'faq_demo_1',
    question: 'What exactly is vBiz Me?',
    answer:
      'vBiz Me is a video-first digital business card. It opens with a quick intro video, then puts one-tap actions (Book, Call, Text, Get a Quote) right under it. People can Save My Info to contacts in one tap, and you get analytics on views and clicks.',
    active: true,
  },
  {
    id: 'faq_demo_2',
    question: "How's this different from paper cards or link farms?",
    answer:
      'Paper cards get tossed. Link pages are clutter. vBiz Me is a mini commercial built to convert: video up top, clear CTAs, and reporting so you know what is working.',
    active: true,
  },
  {
    id: 'faq_demo_3',
    question: 'Does this replace my website or socials?',
    answer:
      'No. vBiz Me is the front door that gets opened. It funnels attention to your site, reviews, calendar, payments, portfolio, and socials—in the right order.',
    active: true,
  },
  {
    id: 'faq_demo_4',
    question: 'Will the video autoplay with sound?',
    answer:
      'Browsers block autoplay with sound. Your video autoplays muted; users tap to unmute. The logo locks in after the intro, CTAs are right below, and music/voice plays when they tap.',
    active: true,
  },
  {
    id: 'faq_demo_5',
    question: 'What actions can I add?',
    answer:
      'Book a Consult, Call Now, Text Me, Get a Quote, Pay/Invoice, Reviews, Directions/Maps, plus Save My Info (.vcf). We can add custom buttons and reorder them to match your sales flow.',
    active: true,
  },
  {
    id: 'faq_demo_6',
    question: 'What do the analytics show me?',
    answer:
      'Clear signal: who viewed, what they tapped, and which sections got attention. Use it to follow up smart, not spammy.',
    active: true,
  },
  {
    id: 'faq_demo_7',
    question: 'How does pricing and setup work—solo and teams?',
    answer:
      'A small setup plus a low monthly tier, with unlimited updates. Teams get on-brand templates, event QR codes, and light CRM/lead routing.',
    active: true,
  },
]
