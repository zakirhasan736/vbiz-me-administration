'use client'

import { notify } from '@/lib/toast/toast'
import {
  useListCardChangeHistoryQuery,
  useRestoreCardChangeMutation,
  type CardMediaSlot,
  type CardTabCount,
} from '@/redux/features/profiles/profiles.api'
import { Film, History, ImageIcon, ImageOff, Loader2, RotateCcw } from 'lucide-react'

function formatWhen(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function tabLine(tab: CardTabCount) {
  if (tab.empty || tab.count <= 0) return 'Empty'
  return tab.count === 1 ? '1 item' : `${tab.count} items`
}

const MEDIA_KIND_LABEL: Record<CardMediaSlot['kind'], string> = {
  image: 'Image',
  video: 'Video',
  none: 'Not set',
}

function ImageSplit({ tab }: { tab: CardTabCount }) {
  if (tab.empty || typeof tab.withImage !== 'number') return null
  const withoutImage = tab.withoutImage ?? Math.max(0, tab.count - tab.withImage)
  return (
    <span className="flex flex-wrap gap-1.5 text-[11px] font-bold">
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
        <ImageIcon className="h-3 w-3" /> {tab.withImage} with image
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
        <ImageOff className="h-3 w-3" /> {withoutImage} no image
      </span>
    </span>
  )
}

function TabCountList({ tabs, personalMedia }: { tabs: CardTabCount[]; personalMedia?: CardMediaSlot[] }) {
  if (!tabs.length && !personalMedia?.length) {
    return <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No tabs on this card.</p>
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {personalMedia?.length ? (
        <li className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm sm:col-span-2 dark:border-white/10 dark:bg-white/5">
          <span className="font-semibold text-slate-800 dark:text-slate-100">Personal info media</span>
          <span className="flex flex-wrap gap-1.5 text-[11px] font-bold">
            {personalMedia.map((slot) => (
              <span
                key={slot.id}
                className={
                  slot.kind === 'none'
                    ? 'inline-flex items-center gap-1 rounded-full bg-slate-200/70 px-2 py-0.5 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                    : 'inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                }
              >
                {slot.kind === 'video' ? (
                  <Film className="h-3 w-3" />
                ) : slot.kind === 'image' ? (
                  <ImageIcon className="h-3 w-3" />
                ) : (
                  <ImageOff className="h-3 w-3" />
                )}
                {slot.label}: {MEDIA_KIND_LABEL[slot.kind]}
              </span>
            ))}
          </span>
        </li>
      ) : null}
      {tabs.map((tab) => (
        <li
          key={tab.id}
          className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate font-semibold text-slate-800 dark:text-slate-100">{tab.label}</span>
            <span
              className={
                tab.empty
                  ? 'shrink-0 text-xs font-bold tracking-wide text-slate-400 uppercase'
                  : 'shrink-0 text-xs font-bold text-slate-700 dark:text-slate-200'
              }
            >
              {tabLine(tab)}
            </span>
          </span>
          <ImageSplit tab={tab} />
        </li>
      ))}
    </ul>
  )
}

export function CardChangeHistoryPanel({ cardId }: { cardId?: string }) {
  const profileId = cardId?.trim() || ''
  const { data, isLoading, isError, refetch } = useListCardChangeHistoryQuery({ id: profileId }, { skip: !profileId })
  const [restoreChange, restoreState] = useRestoreCardChangeMutation()
  const items = data?.items || []
  const inventory = data?.inventory
  const backups = data?.backups || []

  const onRestore = async (historyId: string) => {
    if (!profileId) return
    try {
      await restoreChange({ id: profileId, historyId }).unwrap()
      notify.success('That change was restored.')
      await refetch()
    } catch (error) {
      const apiError = error as { data?: { message?: string }; message?: string }
      notify.error(apiError.data?.message || apiError.message || 'This change could not be restored.')
    }
  }

  if (!profileId) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-600 dark:border-white/10 dark:bg-[#070a13] dark:text-slate-400">
        Save the card first to start collecting change history.
      </p>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm font-medium text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading history…
      </div>
    )
  }

  if (isError) {
    return <p className="p-6 text-sm font-medium text-rose-600">Could not load change history.</p>
  }

  const tabCount = inventory?.tabCount ?? inventory?.tabs.length ?? 0

  return (
    <div className="space-y-3">
      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#070a13]">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {inventory ? `${tabCount} ${tabCount === 1 ? 'tab' : 'tabs'} now` : 'Tabs now'}
        </h3>
        <p className="mt-1 mb-3 text-[12px] font-medium text-slate-500 dark:text-slate-400">
          Each tab on this card, how many items it has, and how many of those have an image. A tab with nothing stored
          is marked Empty.
        </p>
        <TabCountList tabs={inventory?.tabs || []} personalMedia={inventory?.personalMedia} />
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#070a13]">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daily backups</h3>
        <p className="mt-1 mb-3 text-[12px] font-medium text-slate-500 dark:text-slate-400">
          Every card is backed up once a day. The newest 7 days are kept. On the 8th day, the oldest day is deleted.
        </p>
        {backups.length ? (
          <div className="space-y-3">
            {backups.map((backup) => (
              <article key={backup.id} className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                <p className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                  {backup.backupDate} · {backup.tabCount} {backup.tabCount === 1 ? 'tab' : 'tabs'}
                </p>
                <TabCountList tabs={backup.tabs} personalMedia={backup.personalMedia} />
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No daily backup is stored yet. Opening this page saves today, and the nightly job saves every card.
          </p>
        )}
      </section>

      {!items.length ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-sm font-medium text-slate-500 dark:border-white/10 dark:bg-[#070a13] dark:text-slate-400">
          No builder changes recorded yet. Edits to services, settings, and other card areas will appear here.
        </div>
      ) : null}
      {items.map((row) => {
        const restoreBusy = restoreState.isLoading && restoreState.originalArgs?.historyId === row.id
        const restoreDisabled = !row.canRestore || restoreState.isLoading
        const restoreTitle = row.canRestore
          ? 'Restore this change'
          : 'Data life expired — this change cannot be restored'

        return (
          <article
            key={row.id}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#070a13]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {row.changeCode ? (
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200">
                      #{row.changeCode}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-slate-700 uppercase dark:bg-white/10 dark:text-slate-200">
                    {row.areaLabel}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-amber-800 uppercase dark:bg-amber-500/15 dark:text-amber-200">
                    {row.action}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{row.summary}</p>
                {row.action === 'sync' || row.syncSourceName || row.syncSourceSlug ? (
                  <p className="mt-2 rounded-xl border border-sky-200/80 bg-sky-50 px-3 py-2 text-[12px] font-semibold text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
                    {row.syncSourceName || row.syncSourceSlug
                      ? `Corporate linked sync from “${row.syncSourceName || row.syncSourceSlug}”${
                          row.syncSourceSlug && row.syncSourceName ? ` (/${row.syncSourceSlug})` : ''
                        }${row.syncScope ? ` · ${row.syncScope}` : ''}`
                      : 'Corporate linked sync'}
                    {typeof row.syncTargetCount === 'number'
                      ? ` · ${row.syncTargetCount} linked card${row.syncTargetCount === 1 ? '' : 's'} updated`
                      : ''}
                  </p>
                ) : null}
                <dl className="mt-3 grid gap-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="text-slate-400">When: </span>
                    {formatWhen(row.createdAt)}
                  </div>
                  <div>
                    <span className="text-slate-400">Who: </span>
                    {row.actorName} · {row.actorRoleLabel}
                    {row.actorEmail ? ` · ${row.actorEmail}` : ''}
                  </div>
                  <div>
                    <span className="text-slate-400">Device: </span>
                    {row.device}
                  </div>
                  <div>
                    <span className="text-slate-400">Location: </span>
                    {row.location}
                  </div>
                  {row.ip ? (
                    <div>
                      <span className="text-slate-400">IP: </span>
                      {row.ip}
                    </div>
                  ) : null}
                  {row.countryName || row.country ? (
                    <div>
                      <span className="text-slate-400">Country: </span>
                      {row.countryName || row.country}
                      {row.countryName && row.country ? ` (${row.country})` : ''}
                    </div>
                  ) : null}
                </dl>
                {row.healthLabel ? (
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
                    Card status: {row.healthLabel}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                disabled={restoreDisabled}
                title={restoreTitle}
                onClick={() => void onRestore(row.id)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:text-slate-100 dark:enabled:hover:bg-white/5"
              >
                {restoreBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Restore
              </button>
            </div>
          </article>
        )
      })}
      <p className="flex items-start gap-2 px-1 text-[12px] font-medium text-slate-400">
        <History className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Restore copies are kept for 10 days (latest 10 snapshots). After that the list stays, but Restore is disabled.
      </p>
    </div>
  )
}
