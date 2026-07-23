import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

type VCardsListHeaderProps = {
  query: string
  onQueryChange: (value: string) => void
}

export function VCardsListHeader({ query, onQueryChange }: VCardsListHeaderProps) {
  return (
    <div className="mb-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">My vCards</h1>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          Manage and edit your digital business cards.
        </p>
      </div>

      <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search your cards..."
            className="focus:ring-primary-500/20 focus:border-primary-500 dark:focus:ring-primary-500/20 dark:focus:border-primary-500 w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-[13.5px] font-medium text-slate-900 shadow-sm transition-all outline-none placeholder:text-slate-400 focus:ring-2 dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-100"
          />
        </div>
        <Link
          href="/vcards/create/home"
          data-tour-id="tour-create-vcard"
          className="bg-primary-600 hover:bg-primary-700 hover:shadow-primary-500/20 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-95 sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Create New
        </Link>
      </div>
    </div>
  )
}
