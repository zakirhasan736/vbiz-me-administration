export type VCardUploadSection = 'personal-info' | 'social-games' | 'education' | 'experience'

export type VCardAutoFillResult = Record<string, string>

const DEMO_BY_SECTION: Record<VCardUploadSection, VCardAutoFillResult> = {
  'personal-info': {
    slug: 'alex-morgan',
    'personal.fullName': 'Alex Morgan',
    'personal.email': 'alex.morgan@example.com',
    'personal.dob': '1992-06-15',
    'personal.gender': 'Male',
    'personal.relationship': 'Single',
    'personal.profession': 'Developer',
    'personal.designation': 'Senior Product Engineer',
    'personal.company': 'Vibz Technologies',
    'personal.phone': '+1 555 010 2847',
    'personal.whatsapp': '+1 555 010 2847',
    'personal.address': '742 Evergreen Terrace, San Francisco, CA 94102',
    'personal.website': 'https://alexmorgan.dev',
    'personal.about':
      'Product-focused engineer with 8+ years building delightful digital experiences. Passionate about design systems, AI-assisted workflows, and helping teams ship faster.',
    'personal.explainerVideoUrl': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    zip: '94102',
    state: 'California',
    city: 'San Francisco',
  },
  'social-games': {
    instagram: 'alexmorgan',
    facebook: 'alexmorgan.dev',
    twitter: 'alexmorgan',
    tiktok: 'alexmorgan',
    youtube: 'alexmorgandev',
    truth: 'alexmorgan',
    rumble: 'alexmorgan',
    linkedin: 'alexmorgan',
    gameTitle: 'Chess Rush',
    gameUrl: 'https://chess.com/member/alexmorgan',
  },
  education: {
    institute: 'Stanford University',
    degree: 'B.S. Computer Science',
    fromDate: '2010-09-01',
    toDate: '2014-06-01',
  },
  experience: {
    company: 'Vibz Technologies',
    jobTitle: 'Senior Product Engineer',
    description:
      'Led cross-functional squads shipping vCard builder features, design system adoption, and AI-assisted profile imports.',
    fromDate: '2019-03-01',
    toDate: '2026-01-01',
  },
}

export function getDemoAutoFillForSection(section: VCardUploadSection): VCardAutoFillResult {
  return { ...DEMO_BY_SECTION[section] }
}

export const VCARD_UPLOAD_SECTION_LABELS: Record<VCardUploadSection, { title: string; description: string }> = {
  'personal-info': {
    title: 'Import from document or photo',
    description:
      'Upload a resume, business card, or ID photo. We will read it and fill your personal details below (demo preview).',
  },
  'social-games': {
    title: 'Import social & link details',
    description: 'Upload a media kit or contact sheet to populate handles and custom links (demo preview).',
  },
  education: {
    title: 'Import education history',
    description: 'Upload a transcript or CV to fill institute, degree, and dates (demo preview).',
  },
  experience: {
    title: 'Import work experience',
    description: 'Upload a resume to populate company, role, and timeline fields (demo preview).',
  },
}
