'use client'

import { CardLifecycleTabs, type CardLifecycleTab } from '@/components/dashboard/vcard/CardLifecycleTabs'
import { Tooltip } from '@/components/ui'
import { CreateCardLauncher } from '@/components/vcard/create-agent/CreateCardLauncher'
import { cn } from '@/utils/cn'
import { Plus, Search, X } from 'lucide-react'

export type VCardStatusFilter = 'all' | 'active' | 'inactive'
export type VCardSortOption = 'newest' | 'name' | 'views'

type VCardsListHeaderProps = {
  query: string
  onQueryChange: (value: string) => void
  lifecycleTab: CardLifecycleTab
  onLifecycleTabChange: (value: CardLifecycleTab) => void
  activeCount: number
  draftCount: number
  sort: VCardSortOption
  onSortChange: (value: VCardSortOption) => void
  canCreate: boolean
  isPersonal?: boolean
  createDisabledReason?: string
}

export function VCardsListHeader({
  query,
  onQueryChange,
  lifecycleTab,
  onLifecycleTabChange,
  activeCount,
  draftCount,
  sort,
  onSortChange,
  canCreate,
  isPersonal = false,
  createDisabledReason,
}: VCardsListHeaderProps) {
  const hasFilters = query.trim().length > 0 || lifecycleTab !== 'active' || sort !== 'newest'

  const clearFilters = () => {
    onQueryChange('')
    onLifecycleTabChange('active')
    onSortChange('newest')
  }

  return (
    <div className="mb-8 space-y-5">
      <div className="relative overflow-visible rounded-4xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-4xl">
          <div className="absolute top-0 right-0 h-64 w-64 bg-violet-500/5 blur-[100px]" />
        </div>
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span
              className={cn(
                'mb-3 inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-black tracking-wider uppercase',
                isPersonal
                  ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300'
                  : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
              )}
            >
              {isPersonal ? 'Personal Directory' : 'Card Directory'}
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              {isPersonal ? 'My vCard' : 'My vCards'}
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-slate-500 dark:text-slate-400">
              {isPersonal
                ? 'Manage your personal digital business card — drafts stay here until you activate them.'
                : 'Manage and edit your digital business cards. Active is the live directory; Draft holds incomplete cards.'}
            </p>
          </div>

          {canCreate ? (
            <CreateCardLauncher>
              {(open) => (
                <button
                  type="button"
                  onClick={open}
                  data-tour-id="tour-create-vcard"
                  className="bg-primary-600 hover:bg-primary-700 hover:shadow-primary-500/20 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
                >
                  <Plus className="h-4 w-4" /> Create New Card
                </button>
              )}
            </CreateCardLauncher>
          ) : (
            <Tooltip
              content={createDisabledReason ?? 'Card limit reached'}
              side="bottom"
              wrap
              contentClassName="md:min-w-48 md:max-w-xl"
              tabIndex={0}
            >
              <button
                type="button"
                disabled
                aria-disabled="true"
                data-tour-id="tour-create-vcard"
                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-6 py-3 text-[13.5px] font-semibold text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
              >
                <Plus className="h-4 w-4" /> Create New Card
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {isPersonal ? (
        <CardLifecycleTabs
          value={lifecycleTab}
          onChange={onLifecycleTabChange}
          activeCount={activeCount}
          draftCount={draftCount}
        />
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-sm backdrop-blur sm:flex-row sm:flex-wrap sm:items-center dark:border-white/10 dark:bg-[#0b0f19]/80">
          <CardLifecycleTabs
            value={lifecycleTab}
            onChange={onLifecycleTabChange}
            activeCount={activeCount}
            draftCount={draftCount}
          />
          <div className="relative min-w-0 flex-1 sm:min-w-56">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search name, title, company, slug…"
              className="focus:ring-primary-500/20 focus:border-primary-500 w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-[13px] font-medium text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:ring-2 dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-100"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as VCardSortOption)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-bold text-slate-700 outline-none dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-300"
            aria-label="Sort cards"
          >
            <option value="newest">Newest</option>
            <option value="name">Name A–Z</option>
            <option value="views">Most views</option>
          </select>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-[12px] font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <X className="h-3.5 w-3.5" /> Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
