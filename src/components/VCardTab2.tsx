'use client'

import { SlugAvailabilityField } from '@/components/vcard/SlugAvailabilityField'
import { VCardDateInput } from '@/components/vcard/VCardDateInput'
import { useVCard } from '@/lib/VCardContext'
import {
  AlignLeft,
  Briefcase,
  Building,
  Calendar,
  Globe,
  Heart,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  User,
} from 'lucide-react'
import { ReactNode } from 'react'

function FieldGroup({
  label,
  required,
  children,
  icon,
}: {
  label: string
  required?: boolean
  children: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="group flex flex-col space-y-1.5">
      <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
        {label} {required && <span className="font-black text-red-500">*</span>}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <div className="pointer-events-none absolute top-1/2 left-4 z-10 flex -translate-y-1/2 items-center text-slate-500/70">
            {icon}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

const inputClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm'
const selectClasses =
  'w-full bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/10 rounded-[16px] px-5 py-4 text-[13px] font-medium text-slate-900 dark:text-white transition-all outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 appearance-none cursor-pointer shadow-sm'

export function Tab2PersonalInfo() {
  const { vCardData, updateData, cardId, isCreateMode } = useVCard()

  return (
    <div className="animate-in fade-in w-full pb-12 duration-500">
      <div className="bg-primary-50/50 dark:bg-primary-500/2 border-primary-100 dark:border-primary-500/10 mb-8 rounded-3xl border p-6">
        <h3 className="text-primary-600 dark:text-primary-400 mb-2 text-lg font-black">Personal Information</h3>
        <p className="text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          This info appears in the &ldquo;About Me&rdquo; section of your vCard. Ensure your details are accurate as
          they represent your public digital identity. Fields marked <span className="font-black text-red-500">*</span>{' '}
          are required.
        </p>
      </div>

      <div className="space-y-8">
        {/* Public URL */}
        <section className="overflow-hidden rounded-4xl border border-slate-200/50 bg-slate-50/50 shadow-sm dark:border-white/5 dark:bg-white/2">
          <div className="flex items-center gap-4 border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-sky-100 bg-sky-50 dark:border-sky-500/20 dark:bg-sky-500/10">
              <Link2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <h4 className="text-[16px] font-black text-slate-900 dark:text-white">Public URL</h4>
          </div>
          <div className="p-4 sm:p-8">
            <div className="group flex flex-col space-y-1.5">
              <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
                URL slug <span className="font-black text-red-500">*</span>
              </label>
              <SlugAvailabilityField
                value={vCardData.slug}
                onChange={(slug) => updateData('slug', slug)}
                excludeId={isCreateMode ? null : cardId}
                variant="personal"
                icon={<Link2 className="h-4 w-4" />}
                inputClassName={`${inputClasses} pl-10 font-mono`}
              />
            </div>
          </div>
        </section>

        {/* My Information Section */}
        <section className="overflow-hidden rounded-4xl border border-slate-200/50 bg-slate-50/50 shadow-sm dark:border-white/5 dark:bg-white/2">
          <div className="flex items-center gap-4 border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
            <div className="bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 flex h-10 w-10 items-center justify-center rounded-[14px] border">
              <User className="text-primary-600 dark:text-primary-400 h-5 w-5" />
            </div>
            <h4 className="text-[16px] font-black text-slate-900 dark:text-white">My Information</h4>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 p-4 sm:grid-cols-2 sm:p-8">
            <FieldGroup label="Name" required icon={<User className="h-4 w-4" />}>
              <input
                type="text"
                value={vCardData.personal.fullName}
                onChange={(e) => updateData('personal.fullName', e.target.value)}
                className={`${inputClasses} pl-10`}
              />
            </FieldGroup>

            <FieldGroup label="Email" required icon={<Mail className="h-4 w-4" />}>
              <input
                type="email"
                value={vCardData.personal.email}
                onChange={(e) => updateData('personal.email', e.target.value)}
                className={`${inputClasses} pl-10`}
              />
            </FieldGroup>

            <FieldGroup label="Date of Birth" required icon={<Calendar className="h-4 w-4" />}>
              <VCardDateInput
                value={vCardData.personal.dob}
                onChange={(e) => updateData('personal.dob', e.target.value)}
                className={`${inputClasses} pl-10`}
              />
            </FieldGroup>

            <FieldGroup label="Gender" icon={<User className="h-4 w-4" />}>
              <div className="relative w-full">
                <select
                  value={vCardData.personal.gender}
                  onChange={(e) => updateData('personal.gender', e.target.value)}
                  className={`${selectClasses} pl-10`}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500 dark:text-slate-400">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </FieldGroup>

            <FieldGroup label="Relationship" icon={<Heart className="h-4 w-4" />}>
              <div className="relative w-full">
                <select
                  value={vCardData.personal.relationship}
                  onChange={(e) => updateData('personal.relationship', e.target.value)}
                  className={`${selectClasses} pl-10`}
                >
                  <option>Single</option>
                  <option>Married</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500 dark:text-slate-400">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </FieldGroup>

            <FieldGroup label="Profession" icon={<Briefcase className="h-4 w-4" />}>
              <input
                type="text"
                value={vCardData.personal.profession}
                onChange={(e) => updateData('personal.profession', e.target.value)}
                className={`${inputClasses} pl-10`}
              />
            </FieldGroup>

            <FieldGroup label="Designation" icon={<User className="h-4 w-4" />}>
              <input
                type="text"
                value={vCardData.personal.designation}
                onChange={(e) => updateData('personal.designation', e.target.value)}
                className={`${inputClasses} pl-10`}
              />
            </FieldGroup>

            <FieldGroup label="Company / Office Name" icon={<Building className="h-4 w-4" />}>
              <input
                type="text"
                value={vCardData.personal.company}
                onChange={(e) => updateData('personal.company', e.target.value)}
                className={`${inputClasses} pl-10`}
              />
            </FieldGroup>

            <FieldGroup label="Website" icon={<Globe className="h-4 w-4" />}>
              <input
                type="url"
                value={vCardData.personal.website || ''}
                onChange={(e) => updateData('personal.website', e.target.value)}
                placeholder="https://yoursite.com"
                className={`${inputClasses} pl-10`}
              />
            </FieldGroup>

            <FieldGroup label="Phone" required icon={<Phone className="h-4 w-4" />}>
              <input
                type="text"
                value={vCardData.personal.phone}
                onChange={(e) => updateData('personal.phone', e.target.value)}
                className={`${inputClasses} pl-10`}
              />
            </FieldGroup>

            <FieldGroup label="WhatsApp" icon={<MessageCircle className="h-4 w-4" />}>
              <input
                type="text"
                value={vCardData.personal.whatsapp}
                onChange={(e) => updateData('personal.whatsapp', e.target.value)}
                className={`${inputClasses} pl-10`}
              />
            </FieldGroup>
          </div>
        </section>

        {/* Address Details Section */}
        <section className="overflow-hidden rounded-4xl border border-slate-200/50 bg-slate-50/50 shadow-sm dark:border-white/5 dark:bg-white/2">
          <div className="flex items-center gap-4 border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-[16px] font-black text-slate-900 dark:text-white">Address Details</h4>
          </div>
          <div className="p-4 sm:p-8">
            <FieldGroup label="Address" icon={<MapPin className="h-4 w-4" />}>
              <input
                type="text"
                value={vCardData.personal.address}
                onChange={(e) => updateData('personal.address', e.target.value)}
                className={`${inputClasses} pl-11`}
              />
            </FieldGroup>
          </div>
        </section>

        {/* About Me Section */}
        <section className="overflow-hidden rounded-4xl border border-slate-200/50 bg-slate-50/50 shadow-sm dark:border-white/5 dark:bg-white/2">
          <div className="flex items-center gap-4 border-b border-slate-200/50 px-4 py-6 sm:px-8 dark:border-white/5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-purple-100 bg-purple-50 dark:border-purple-500/20 dark:bg-purple-500/10">
              <AlignLeft className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="text-[16px] font-black text-slate-900 dark:text-white">About Me</h4>
          </div>
          <div className="p-4 sm:p-8">
            <textarea
              value={vCardData.personal.about}
              onChange={(e) => updateData('personal.about', e.target.value)}
              rows={6}
              className="focus:border-primary-500 focus:ring-primary-500 w-full resize-none rounded-[20px] border border-slate-200/80 bg-white px-6 py-5 text-[14px] leading-relaxed font-medium text-slate-900 shadow-sm transition-all outline-none focus:ring-1 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
