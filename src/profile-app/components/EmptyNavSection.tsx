'use client'

import { CustomTabSection } from '@/profile-app/components/CustomTabSection'
import { DynamicPostsSection } from '@/profile-app/components/DynamicPostsSection'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { V3SectionShell } from '@/profile-app/sections'
import { useGetDynamicSectionQuery } from '@/redux/api'
import { FileQuestion } from 'lucide-react'

type EmptyNavSectionProps = {
  title: string
  sectionName?: string
}

/** Fallback for custom nav tabs; reads dynamic-section data when the backend provides a section name. */
export function EmptyNavSection({ title, sectionName }: EmptyNavSectionProps) {
  const { cardOwnerId, customTabs } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const resolvedSectionName = sectionName?.trim() ?? ''
  const customTab = customTabs.find(
    (tab) =>
      tab.id === resolvedSectionName || tab.label.trim() === title.trim() || tab.label.trim() === resolvedSectionName
  )

  const { data, isLoading, isError } = useGetDynamicSectionQuery(
    { profileId, sectionName: resolvedSectionName },
    { skip: !profileId || !resolvedSectionName || Boolean(customTab) }
  )

  if (customTab) {
    return <CustomTabSection title={title} sectionName={resolvedSectionName || customTab.id} />
  }

  if (profileId && resolvedSectionName) {
    return (
      <DynamicPostsSection
        sectionTitle={data?.sectionTitle ?? title}
        posts={data?.posts ?? []}
        isLoading={isLoading}
        isError={isError}
        badgeLabel={title}
        emptyMessage="No published content is available for this section yet."
      />
    )
  }

  return (
    <V3SectionShell>
      <div className="flex min-h-[280px] w-full flex-col items-center justify-center rounded-4xl border border-dashed border-zinc-200 bg-white/40 px-6 py-16 text-center dark:border-zinc-800/80 dark:bg-[#031327]/40">
        <div className="vbiz-pill-icon mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border">
          <FileQuestion size={24} />
        </div>
        <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">{title}</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed font-medium text-zinc-500 dark:text-zinc-400">
          Content for this section is not available yet.
        </p>
      </div>
    </V3SectionShell>
  )
}
