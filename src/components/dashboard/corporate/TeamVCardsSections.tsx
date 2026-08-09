'use client'

import { cn } from '@/utils/cn'
import { AlertTriangle, Plus, Search, Sparkles, X } from 'lucide-react'
import Link from 'next/link'
import type { CorporateSortOption, CorporateStatusFilter } from './useCorporateDirectory'

type TeamVCardsHeaderProps = {
  canCreate: boolean
  createDisabledReason: string
}

export function TeamVCardsHeader({ canCreate, createDisabledReason }: TeamVCardsHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#0b0f19]">
      <div className="bg-primary-600/5 pointer-events-none absolute top-0 right-0 h-80 w-80 blur-[120px]" />
      <div className="z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <span className="bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 mb-2 inline-block rounded-md px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase">
            Corporate Directory
          </span>
          <h1 className="text-3xl leading-tight font-black tracking-tight text-slate-900 dark:text-white">
            Manage Team vCards
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Build, edit, delete, and download smart QR codes for your team directory.
          </p>
        </div>
        <div className="z-10 flex flex-col items-stretch gap-2 sm:items-end">
          {canCreate ? (
            <Link
              href="/vcards/create/home"
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm transition-all hover:shadow-md active:scale-95 dark:bg-white dark:text-slate-900"
            >
              <Plus className="h-4.5 w-4.5" /> Create New Card
            </Link>
          ) : (
            <>
              <button
                type="button"
                disabled
                title={createDisabledReason}
                className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 px-6 py-3.5 text-xs font-black tracking-wider text-slate-400 uppercase opacity-70 dark:bg-white/10 dark:text-slate-500"
              >
                <Plus className="h-4.5 w-4.5" /> Create New Card
              </button>
              <span className="max-w-[220px] text-right text-[10px] leading-snug font-bold text-slate-400">
                {createDisabledReason}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

type TeamVCardsToolbarProps = {
  searchTerm: string
  onSearchChange: (v: string) => void
  statusFilter: CorporateStatusFilter
  onStatusChange: (v: CorporateStatusFilter) => void
  sort: CorporateSortOption
  onSortChange: (v: CorporateSortOption) => void
}

export function TeamVCardsToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sort,
  onSortChange,
}: TeamVCardsToolbarProps) {
  const hasFilters = searchTerm || statusFilter !== 'all' || sort !== 'newest'

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:flex-row dark:border-white/10 dark:bg-[#0b0f19]">
      <div className="relative w-full md:flex-1">
        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, designation, department..."
          className="focus:ring-primary-500/20 focus:border-primary-500 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-xs font-semibold text-slate-900 shadow-sm outline-none dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
        />
      </div>
      <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
        <FilterSelect label="Status" value={statusFilter} onChange={(v) => onStatusChange(v as CorporateStatusFilter)}>
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
          <option value="suspended">Suspended Only</option>
        </FilterSelect>
        <FilterSelect label="Sort By" value={sort} onChange={(v) => onSortChange(v as CorporateSortOption)}>
          <option value="newest">Newest Created</option>
          <option value="oldest">Oldest Created</option>
          <option value="name-asc">Name (A - Z)</option>
          <option value="name-desc">Name (Z - A)</option>
        </FilterSelect>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              onSearchChange('')
              onStatusChange('all')
              onSortChange('newest')
            }}
            className="rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            Clear Filters
          </button>
        ) : null}
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-white/10 dark:bg-slate-950/40">
      <span className="text-[10px] font-black text-slate-400 uppercase">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer border-none bg-transparent p-1 text-xs font-bold text-slate-700 outline-none dark:text-slate-200"
      >
        {children}
      </select>
    </div>
  )
}

type TeamVCardsQuotaTrackerProps = {
  currentCount: number
  quotaLimit: number
  quotaPercentage: number
}

export function TeamVCardsQuotaTracker({ currentCount, quotaLimit, quotaPercentage }: TeamVCardsQuotaTrackerProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="flex flex-col justify-between rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm md:col-span-2 dark:border-white/5 dark:bg-[#0b0f19]">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
              Directory Quota Usage
            </span>
            <span className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 rounded-md px-2.5 py-1 text-xs font-bold">
              {currentCount} of {quotaLimit} Cards Created
            </span>
          </div>
          <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Maximum Capacity Limit</h3>
          <p className="mb-6 text-xs font-semibold text-slate-400">
            Corporate Accounts are provisioned with {quotaLimit} dynamic card slots.
          </p>
        </div>
        <div className="space-y-2">
          <div className="relative h-3 w-full overflow-hidden rounded-full border border-slate-200/10 bg-slate-100 dark:bg-slate-800">
            <div
              className={cn(
                'absolute top-0 left-0 h-full rounded-full transition-all duration-500',
                quotaPercentage > 85 ? 'bg-red-500' : quotaPercentage > 50 ? 'bg-amber-500' : 'bg-primary-500'
              )}
              style={{ width: `${quotaPercentage}%` }}
            />
          </div>
          <div className="flex justify-between pl-0.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
            <span>0 Cards</span>
            <span>{quotaLimit} Max Cap</span>
          </div>
        </div>
      </div>
      <div className="relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-900 to-slate-950 p-6 text-white shadow-md">
        <div className="bg-primary-500/10 absolute top-0 right-0 h-44 w-44 rounded-full blur-2xl" />
        <div>
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10">
            <Sparkles className="text-primary-300 h-5 w-5" />
          </div>
          <h4 className="mb-1.5 text-[14px] font-bold tracking-tight">Pro tip: Deploy unique themes</h4>
          <p className="text-[12px] leading-relaxed font-semibold text-indigo-200">
            Each corporate card has independent styling controls, custom analytics endpoints, and can toggle solution
            sections separately.
          </p>
        </div>
        <span className="mt-4 text-[10px] font-black tracking-widest text-indigo-400 uppercase">
          vBiz Premium Cloud Enabled
        </span>
      </div>
    </div>
  )
}

export function TeamVCardsCreatePlaceholder({
  canCreate,
  quotaLimit,
  onCreate,
}: {
  canCreate: boolean
  quotaLimit: number
  onCreate: () => void
}) {
  if (canCreate) {
    return (
      <button
        type="button"
        onClick={onCreate}
        className="group hover:border-primary-500/30 flex min-h-[350px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition-all hover:bg-slate-100 dark:border-white/10 dark:bg-[#070a13] dark:hover:bg-white/[0.02]"
      >
        <div className="group-hover:bg-primary-500 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all group-hover:scale-110 group-hover:text-white dark:border-white/10 dark:bg-[#0b0f19]">
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Create New Card</h3>
        <p className="mt-1 max-w-[200px] text-[12px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Add a dynamic digital business card to your directory.
        </p>
      </button>
    )
  }

  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-red-500/20 bg-red-500/5 p-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-[15px] font-bold text-red-500">Quota Limit Exceeded</h3>
      <p className="mt-1 max-w-[200px] text-[12px] leading-relaxed font-semibold text-slate-500 dark:text-slate-400">
        You&apos;ve hit the maximum capacity of {quotaLimit} business cards. Delete existing profiles to free up slots.
      </p>
    </div>
  )
}

export function TeamVCardsEmptyState({
  hasFilters,
  canCreate,
  createDisabledReason,
  onClearFilters,
  onCreate,
}: {
  hasFilters: boolean
  canCreate: boolean
  createDisabledReason: string
  onClearFilters: () => void
  onCreate: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-300 bg-white/50 px-4 py-20 text-center dark:border-white/10 dark:bg-[#0b0f19]/50">
      <h3 className="mb-3 text-2xl font-extrabold text-slate-900 dark:text-white">No vCards Found</h3>
      <p className="mx-auto mb-8 max-w-md font-medium text-slate-500 dark:text-slate-400">
        {hasFilters
          ? "We couldn't find any vCards matching your current search or filter criteria."
          : 'Your corporate network is empty. Create your first team vCard profile to start connecting.'}
      </p>
      {hasFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-[14px] font-bold text-slate-900 shadow-sm transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-white"
        >
          Clear Filters
        </button>
      ) : (
        <button
          type="button"
          onClick={onCreate}
          disabled={!canCreate}
          title={!canCreate ? createDisabledReason : undefined}
          className={cn(
            'flex items-center gap-2 rounded-xl px-8 py-3.5 text-[14px] font-bold shadow-sm transition-all',
            canCreate
              ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/20 text-white active:scale-95'
              : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-white/10'
          )}
        >
          <Plus className="h-5 w-5" /> Create New Card
        </button>
      )}
    </div>
  )
}

export { X }
