/** Shared Global Connection directory — same list for every card owner. */

export type GlobalConnectionItem = {
  id: string
  name: string
  title: string
  company: string
  avatar: string
  phone?: string
  email?: string
  slug?: string
}

export const GLOBAL_CONNECTIONS: GlobalConnectionItem[] = [
  {
    id: 'gc_1',
    name: 'Amina Rahman',
    title: 'Growth Partner',
    company: 'vBiz Network',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    phone: '+880 1700-111111',
    email: 'amina@vbiz.me',
    slug: 'amina-rahman',
  },
  {
    id: 'gc_2',
    name: 'Jordan Lee',
    title: 'Product Strategist',
    company: 'Northstar Labs',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    phone: '+1 415-555-0142',
    email: 'jordan@northstar.io',
    slug: 'jordan-lee',
  },
  {
    id: 'gc_3',
    name: 'Sofia Mendes',
    title: 'Creative Director',
    company: 'Studio Pulse',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    phone: '+34 612 000 331',
    email: 'sofia@studiopulse.co',
    slug: 'sofia-mendes',
  },
  {
    id: 'gc_4',
    name: 'Marcus Chen',
    title: 'Enterprise Sales',
    company: 'CloudBridge',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    phone: '+1 646-555-0199',
    email: 'marcus@cloudbridge.com',
    slug: 'marcus-chen',
  },
  {
    id: 'gc_5',
    name: 'Priya Kapoor',
    title: 'Community Lead',
    company: 'vBiz Global',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    phone: '+91 98765 43210',
    email: 'priya@vbiz.me',
    slug: 'priya-kapoor',
  },
]

export function getGlobalConnections() {
  return GLOBAL_CONNECTIONS
}
