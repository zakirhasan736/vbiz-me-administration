import { Briefcase, Building2, Globe, Mail, MapPin, Phone } from 'lucide-react'
import React, { useMemo } from 'react'
import { useProfileDisplay } from '../lib/profileDisplayContext'
import { buildBentoContactItems, type ProfileContactItem } from '../lib/profileHomeData'
import { ProfileActionButtons } from './ProfileActionButtons'

const CONTACT_ICON_MAP: Record<string, React.ElementType> = {
  Profession: Briefcase,
  Company: Building2,
  Email: Mail,
  Phone: Phone,
  Website: Globe,
  Address: MapPin,
}

function ContactBentoCard({ item }: { item: ProfileContactItem }) {
  const Icon = CONTACT_ICON_MAP[item.label] ?? item.icon

  const content = (
    <>
      <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
        <Icon size={12} className="text-[#eab308]" /> {item.label}
      </span>
      <span
        className="text-sm font-bold text-zinc-900 dark:text-zinc-100"
        style={item.style?.textColor ? { color: item.style.textColor } : undefined}
      >
        {item.value}
      </span>
    </>
  )

  if (item.isLink && item.href) {
    return (
      <a
        href={item.href}
        target={item.label === 'Website' ? '_blank' : undefined}
        rel={item.label === 'Website' ? 'noopener noreferrer' : undefined}
        className="group/link flex flex-col justify-center rounded-2xl border border-zinc-200/60 bg-zinc-50/80 p-4 backdrop-blur-md transition-all hover:bg-white hover:shadow-lg dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80"
      >
        {content}
      </a>
    )
  }

  return (
    <div className="flex flex-col justify-center rounded-2xl border border-zinc-200/60 bg-zinc-50/80 p-4 backdrop-blur-md transition-all hover:bg-white hover:shadow-lg dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80">
      {content}
    </div>
  )
}

export const HomeSectionV2 = () => {
  const { personal, isVisible, field } = useProfileDisplay()

  const bentoContactItems = useMemo(
    () => buildBentoContactItems(personal, isVisible, field),
    [personal, isVisible, field]
  )

  return (
    <div className="grid w-full grid-cols-1 gap-6 pb-0 md:grid-cols-2">
      <div className="flex min-h-[42vh] flex-col md:contents md:min-h-0">
        <ProfileActionButtons className="w-full" />
      </div>

      {bentoContactItems.length > 0 && (
        <div className="hidden grid-cols-2 gap-3 md:grid">
          {bentoContactItems.map((item) => (
            <div key={item.label} className={item.colSpan === 2 ? 'col-span-2' : 'col-span-1'}>
              <ContactBentoCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
