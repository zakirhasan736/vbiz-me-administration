'use client'

import { type AdminProfileRow, useGetAdminProfilesQuery } from '@/redux/features/adminProfiles/adminProfiles.api'
import { cn } from '@/utils/cn'
import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export type ProfileOwnerSelection = {
  profileId: string
  hostName: string
}

type ProfileOwnerPickerProps = {
  value: ProfileOwnerSelection | null
  onChange: (next: ProfileOwnerSelection | null) => void
  label?: string
  className?: string
  listClassName?: string
  required?: boolean
}

function ownerLabel(row: AdminProfileRow): string {
  const name = row.name?.trim()
  if (name) return name
  if (row.slug?.trim()) return row.slug.trim()
  return row.email?.trim() || 'vCard Owner'
}

function ownerSubline(row: AdminProfileRow): string {
  const parts = [row.companyName, row.email || row.user?.email, row.slug ? `/${row.slug}` : null].filter(
    Boolean
  ) as string[]
  return parts.join(' · ')
}

export default function ProfileOwnerPicker({
  value,
  onChange,
  label = 'vCard Profile Owner',
  className,
  listClassName,
  required = true,
}: ProfileOwnerPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchQuery.trim()), 300)
    return () => window.clearTimeout(t)
  }, [searchQuery])

  const listQuery = useMemo(
    () => ({
      q: debouncedQ || undefined,
      lifecycle: 'active' as const,
      limit: 20,
      skip: 0,
      sortBy: 'name' as const,
      sortDir: 'asc' as const,
    }),
    [debouncedQ]
  )

  const { data, isLoading, isFetching, isError } = useGetAdminProfilesQuery(listQuery)
  const items = data?.items ?? []

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
            <p className="truncate text-[11px] font-semibold text-slate-400">Selected vCard owner</p>
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
              placeholder="Search by name, email, or company…"
              className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none dark:text-white"
              autoComplete="off"
            />
          </div>

          <div
            className={cn(
              'max-h-48 overflow-y-auto rounded-xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#0b0f19]',
              listClassName
            )}
            role="listbox"
            aria-label="vCard owners"
          >
            {isLoading || isFetching ? (
              <p className="px-3 py-4 text-center text-xs font-semibold text-slate-400">Searching…</p>
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
                    onClick={() => onChange({ profileId: row.id, hostName })}
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
