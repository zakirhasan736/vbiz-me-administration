'use client'

import { mapPublicCardToListItem } from '@/lib/api/publicCards/mapPublicCards'
import { PUBLIC_CARDS_CATALOG_PER_PAGE } from '@/lib/publicCards/publicCardsSearch'
import { useResolvedSectionTitle } from '@/profile-app/lib/sectionTitleContext'
import { useGetPublicCardsQuery } from '@/redux/features/publicCards/publicCards.api'
import { Globe2, Loader2 } from 'lucide-react'
import { useMemo } from 'react'

/** Editor preview of the shared Global Connection directory (live `/public-cards`). */
export function TabGlobalConnection() {
  const sectionTitle = useResolvedSectionTitle(undefined, 'Global Connection')
  const { data, isLoading, isError } = useGetPublicCardsQuery({ per_page: PUBLIC_CARDS_CATALOG_PER_PAGE })
  const list = useMemo(() => (data?.cards ?? []).map(mapPublicCardToListItem), [data?.cards])

  return (
    <div className="animate-in fade-in mx-auto w-full max-w-7xl space-y-6 pb-12 duration-500">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/15">
          <Globe2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">{sectionTitle}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Shared network directory from your vBiz backend — same list on every public card.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-semibold text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading directory…
        </div>
      ) : isError ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm font-semibold text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          Could not load public cards from the API. Check that the backend is running and `NEXT_PUBLIC_API_URL` points
          to your vBiz server.
        </p>
      ) : list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm font-semibold text-slate-400 dark:border-white/10">
          No public cards yet. Publish cards with a slug to show them here.
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((person) => (
            <div
              key={String(person.id)}
              className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-white/10 dark:bg-[#0b0f19]"
            >
              {person.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={person.img}
                  alt=""
                  className="h-14 w-14 rounded-2xl border border-slate-100 object-cover dark:border-white/10"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                  {person.initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-black text-slate-900 dark:text-white">{person.name}</p>
                <p className="truncate text-[12px] font-bold text-slate-500">
                  {person.profession}
                  {person.slug ? ` · /${person.slug}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
