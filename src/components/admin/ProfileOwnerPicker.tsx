'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { MIN_IDENTITY_SEARCH_CHARACTERS, normalizedSearchQuery } from '@/lib/identitySearch'
import { type AdminProfileRow, useGetAdminProfilesQuery } from '@/redux/features/adminProfiles/adminProfiles.api'
import { cn } from '@/utils/cn'
import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export type ProfileOwnerSelection = {
  profileId: string
  hostName: string
  ownerEmails: string[]
  identity: string
}

type ProfileOwnerPickerProps = {
  value: ProfileOwnerSelection | null
  onChange: (next: ProfileOwnerSelection | null) => void
  label?: string
  className?: string
  listClassName?: string
  required?: boolean
  includeDrafts?: boolean
}

function ownerLabel(row: AdminProfileRow): string {
  const name = row.name?.trim()
  if (name) return name
  if (row.slug?.trim()) return row.slug.trim()
  return row.email?.trim() || 'vCard Owner'
}

function ownerSubline(row: AdminProfileRow): string {
  const accountName = row.user?.name?.trim() || row.companyUser?.name?.trim()
  const accountEmail = row.user?.email?.trim() || row.companyUser?.email?.trim() || row.email?.trim()
  const parts = [
    row.designation?.trim(),
    row.profession?.name?.trim(),
    row.companyName,
    accountName,
    accountEmail,
    row.slug ? `/${row.slug}` : null,
  ].filter(Boolean) as string[]
  return [...new Set(parts)].join(' · ')
}

export function profileOwnerSelectionFromRow(row: AdminProfileRow): ProfileOwnerSelection {
  const ownerEmails = [
    ...new Set([row.user?.email, row.companyUser?.email].map((email) => email?.trim().toLowerCase()).filter(Boolean)),
  ] as string[]
  if (!ownerEmails.length && row.email?.trim()) ownerEmails.push(row.email.trim().toLowerCase())
  return {
    profileId: row.id,
    hostName: ownerLabel(row),
    ownerEmails,
    identity: ownerSubline(row),
  }
}

const OWNER_NAME_WIDTHS = ['w-28', 'w-24', 'w-32', 'w-36'] as const
const OWNER_META_WIDTHS = ['w-48', 'w-44', 'w-52', 'w-40'] as const

/** Card-style placeholder matching vCard owner list rows (avatar + name + meta). */
function OwnerSearchRowSkeleton({ index = 0 }: { index?: number }) {
  const i = index % OWNER_NAME_WIDTHS.length

  return (
    <div
      className="flex w-full items-start gap-2.5 border-b border-slate-100 px-3 py-3 last:border-b-0 dark:border-white/5"
      aria-hidden
    >
      <Skeleton className="mt-0.5 h-7 w-7 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className={cn('h-3.5 rounded-md', OWNER_NAME_WIDTHS[i])} />
        <Skeleton variant="text" className={cn('h-2.5 max-w-full', OWNER_META_WIDTHS[i])} />
      </div>
    </div>
  )
}

export default function ProfileOwnerPicker({
  value,
  onChange,
  label = 'vCard Profile Owner',
  className,
  listClassName,
  required = true,
  includeDrafts = false,
}: ProfileOwnerPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const normalizedInput = normalizedSearchQuery(searchQuery)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(normalizedInput), 300)
    return () => window.clearTimeout(t)
  }, [normalizedInput])

  const searchReady = normalizedInput.length >= MIN_IDENTITY_SEARCH_CHARACTERS && debouncedQ === normalizedInput
  const typedLength = searchQuery.trim().length

  const listQuery = useMemo(
    () => ({
      q: debouncedQ || undefined,
      ...(!includeDrafts ? { lifecycle: 'active' as const } : {}),
      limit: 20,
      skip: 0,
      sortBy: 'name' as const,
      sortDir: 'asc' as const,
    }),
    [debouncedQ, includeDrafts]
  )

  const { data, isLoading, isFetching, isError } = useGetAdminProfilesQuery(listQuery, { skip: !searchReady })
  const items = searchReady ? (data?.items ?? []) : []

  return (
    <div className={cn('flex flex-col space-y-1.5', className)}>
      <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
        {label}
        {required ? ' *' : ''}
      </label>

      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-500/25 bg-indigo-500/5 px-3.5 py-2.5 dark:bg-indigo-500/10">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{value.hostName}</p>
            <p className="truncate text-[11px] font-semibold text-slate-400">
              {value.identity || 'Selected vCard owner'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 rounded-lg bg-white/80 p-1.5 text-slate-500 hover:bg-white hover:text-slate-800 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Clear selected owner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/15 dark:bg-slate-800">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, company, designation, profession, phone, or slug…"
              className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none dark:text-white"
              autoComplete="off"
              minLength={MIN_IDENTITY_SEARCH_CHARACTERS}
              aria-describedby="profile-owner-search-help"
            />
          </div>

          <p id="profile-owner-search-help" className="px-1 text-[10px] font-semibold text-slate-400">
            Enter at least {MIN_IDENTITY_SEARCH_CHARACTERS} characters. Results match every word across the full owner
            identity.
          </p>

          <div
            className={cn(
              'max-h-48 overflow-y-auto rounded-xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#0b0f19]',
              listClassName
            )}
            role="listbox"
            aria-label="vCard owners"
          >
            {!searchReady ? (
              <p className="px-3 py-4 text-center text-xs font-semibold text-slate-400">
                {typedLength > 0
                  ? `${MIN_IDENTITY_SEARCH_CHARACTERS - typedLength} more character${MIN_IDENTITY_SEARCH_CHARACTERS - typedLength === 1 ? '' : 's'} needed.`
                  : `Type ${MIN_IDENTITY_SEARCH_CHARACTERS} or more characters to search vCard owners.`}
              </p>
            ) : isLoading || isFetching ? (
              Array.from({ length: 4 }).map((_, index) => <OwnerSearchRowSkeleton key={index} index={index} />)
            ) : isError ? (
              <p className="px-3 py-4 text-center text-xs font-semibold text-rose-500">Could not load vCard owners.</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs font-semibold text-slate-400">No matching vCard owners.</p>
            ) : (
              items.map((row) => {
                const hostName = ownerLabel(row)
                return (
                  <button
                    key={row.id}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => onChange(profileOwnerSelectionFromRow(row))}
                    className="flex w-full items-start gap-2 border-b border-slate-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-[10px] font-black text-indigo-600 uppercase">
                      {hostName.slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-extrabold text-slate-900 dark:text-white">
                        {hostName}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-400">
                        {ownerSubline(row)}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
