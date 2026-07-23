import {
  Facebook,
  FileText,
  Globe,
  Instagram,
  MessageCircle,
  Save,
  Twitter,
  Youtube,
  type LucideIcon,
} from 'lucide-react'

export type StatCard = {
  topText: string
  bottomText: string
  icon: LucideIcon
  color: string
  bg: string
  trend: string
}

export type ChartPoint = {
  name: string
  total: number
}

export type EngagementRow = {
  id: number
  event: string
  viewer: string
  time: string
  platform: string
}

export const statCards: StatCard[] = [
  {
    topText: '0',
    bottomText: 'Contacts Saved',
    icon: Save,
    color: 'text-slate-800 dark:text-slate-200',
    bg: 'bg-slate-100 dark:bg-slate-800',
    trend: '+0%',
  },
  {
    topText: '0',
    bottomText: 'Facebook Clicks',
    icon: Facebook,
    color: 'text-[#1877F2]',
    bg: 'bg-[#1877F2]/10',
    trend: '+0%',
  },
  {
    topText: '0',
    bottomText: 'Twitter Clicks',
    icon: Twitter,
    color: 'text-[#1DA1F2]',
    bg: 'bg-[#1DA1F2]/10',
    trend: '+0%',
  },
  {
    topText: '0',
    bottomText: 'Instagram Clicks',
    icon: Instagram,
    color: 'text-[#E4405F]',
    bg: 'bg-[#E4405F]/10',
    trend: '+0%',
  },
  {
    topText: '0',
    bottomText: 'WhatsApp Clicks',
    icon: MessageCircle,
    color: 'text-[#25D366]',
    bg: 'bg-[#25D366]/10',
    trend: '+0%',
  },
  {
    topText: '0',
    bottomText: 'LinkedIn Clicks',
    icon: FileText,
    color: 'text-[#0A66C2]',
    bg: 'bg-[#0A66C2]/10',
    trend: '+0%',
  },
  {
    topText: '0',
    bottomText: 'YouTube Clicks',
    icon: Youtube,
    color: 'text-[#FF0000]',
    bg: 'bg-[#FF0000]/10',
    trend: '+0%',
  },
  {
    topText: '0',
    bottomText: 'Website Visits',
    icon: Globe,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    trend: '+0%',
  },
]

export const chartData: ChartPoint[] = [
  { name: 'Apr', total: 13 },
  { name: 'May', total: 2 },
  { name: 'Jun', total: 5 },
  { name: 'Jul', total: 12 },
  { name: 'Aug', total: 20 },
  { name: 'Sep', total: 34 },
]

export const tableData: EngagementRow[] = [
  {
    id: 1,
    event: 'Profile Viewed',
    viewer: 'Zakir',
    time: '2 mins ago',
    platform: 'Desktop',
  },
  {
    id: 2,
    event: 'Profile Viewed',
    viewer: 'Zakir',
    time: '1 hour ago',
    platform: 'Mobile',
  },
  {
    id: 3,
    event: 'Profile Viewed',
    viewer: 'Guest',
    time: '1 week ago',
    platform: 'Tablet',
  },
  {
    id: 4,
    event: 'Profile Viewed',
    viewer: 'Guest',
    time: '1 week ago',
    platform: 'Desktop',
  },
  {
    id: 5,
    event: 'Profile Viewed',
    viewer: 'Guest',
    time: '2 weeks ago',
    platform: 'Mobile',
  },
]

export const socialStatCards = statCards.filter(
  (stat) => stat.bottomText !== 'Website Visits' && stat.bottomText !== 'Contacts Saved'
)
