'use client'

import ContactSavesPanel from '@/components/admin/ContactSavesPanel'
import LeadNotesRepliesPanel from '@/components/admin/LeadNotesRepliesPanel'
import { Skeleton } from '@/components/ui/Skeleton'
import { mapAdminLeadRow } from '@/lib/admin/mapAdminLeadRow'
import { isIdentitySearchReady } from '@/lib/identitySearch'
import { notify } from '@/lib/toast/toast'
import {
  type AdminLeadRow,
  useDeleteAdminLeadSaveMutation,
  useGetAdminLeadsNotesQuery,
  useGetAdminLeadsSavesQuery,
  useGetAdminLeadsStatsQuery,
  usePatchAdminLeadNoteMutation,
  usePatchAdminLeadSaveMutation,
} from '@/redux/features/adminLeads/adminLeads.api'
import { cn } from '@/utils/cn'
import { Building, CheckCircle2, MessageCircle, Save, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

const PAGE_SIZE = 50

function appendUnique(prev: AdminLeadRow[], next: AdminLeadRow[]) {
  if (!next.length) return prev
  const seen = new Set(prev.map((row) => row.id))
  const fresh = next.filter((row) => !seen.has(row.id))
  return fresh.length ? [...prev, ...fresh] : prev
}

function mergePagedRows(skip: number, accum: AdminLeadRow[], pageItems: AdminLeadRow[] | undefined) {
  const items = pageItems ?? []
  if (skip === 0) return items
  return appendUnique(accum, items)
}

export default function AdminLeads() {
  const [tab, setTab] = useState<'saves' | 'notes'>('saves')
  const [savesSkip, setSavesSkip] = useState(0)
  const [notesSkip, setNotesSkip] = useState(0)
  const [savesSearch, setSavesSearch] = useState('')
  const [notesSearch, setNotesSearch] = useState('')
  const [savesAccum, setSavesAccum] = useState<AdminLeadRow[]>([])
  const [notesAccum, setNotesAccum] = useState<AdminLeadRow[]>([])
  const [omittedSaveIds, setOmittedSaveIds] = useState<string[]>([])

  const savesQuery = useMemo(
    () => ({
      skip: savesSkip,
      limit: PAGE_SIZE,
      ...(isIdentitySearchReady(savesSearch) ? { q: savesSearch.trim() } : {}),
    }),
    [savesSkip, savesSearch]
  )
  const notesQuery = useMemo(
    () => ({
      skip: notesSkip,
      limit: PAGE_SIZE,
      ...(isIdentitySearchReady(notesSearch) ? { q: notesSearch.trim() } : {}),
    }),
    [notesSkip, notesSearch]
  )

  const { data: stats, isLoading: statsLoading } = useGetAdminLeadsStatsQuery()
  const { data: savesPage, isLoading: savesLoading, isFetching: savesFetching } = useGetAdminLeadsSavesQuery(savesQuery)
  const { data: notesPage, isLoading: notesLoading, isFetching: notesFetching } = useGetAdminLeadsNotesQuery(notesQuery)

  const [deleteSave] = useDeleteAdminLeadSaveMutation()
  const [patchSave] = usePatchAdminLeadSaveMutation()
  const [patchNote] = usePatchAdminLeadNoteMutation()

  const savesRows = useMemo(() => {
    const merged = mergePagedRows(savesSkip, savesAccum, savesPage?.items)
    if (!omittedSaveIds.length) return merged
    const omit = new Set(omittedSaveIds)
    return merged.filter((row) => !omit.has(row.id))
  }, [savesSkip, savesAccum, savesPage?.items, omittedSaveIds])
  const notesRows = useMemo(
    () => mergePagedRows(notesSkip, notesAccum, notesPage?.items),
    [notesSkip, notesAccum, notesPage?.items]
  )
  const saves = useMemo(() => savesRows.map(mapAdminLeadRow), [savesRows])
  const notes = useMemo(() => notesRows.map(mapAdminLeadRow), [notesRows])

  const totalSaves = stats?.totalSaves ?? savesPage?.total ?? saves.length
  const totalNotes = stats?.totalNotes ?? notesPage?.total ?? notes.length
  const sourceCards = stats?.sourceProfiles ?? 0
  const listTotalSaves = savesPage?.total ?? totalSaves
  const listTotalNotes = notesPage?.total ?? totalNotes
  const savesHasMore = Boolean(savesPage?.hasMore ?? savesRows.length < listTotalSaves)
  const notesHasMore = Boolean(notesPage?.hasMore ?? notesRows.length < listTotalNotes)

  const handleDeleteSave = async (id: string) => {
    try {
      await deleteSave(id).unwrap()
      setSavesAccum((prev) => prev.filter((row) => row.id !== id))
      setOmittedSaveIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
      notify.info('Contact save deleted.')
    } catch {
      notify.error('Failed to delete contact save.')
    }
  }

  const loadMoreSaves = () => {
    if (savesPage?.items?.length) {
      setSavesAccum((prev) => (savesSkip === 0 ? savesPage.items : appendUnique(prev, savesPage.items)))
    }
    setSavesSkip((prev) => prev + PAGE_SIZE)
  }

  const loadMoreNotes = () => {
    if (notesPage?.items?.length) {
      setNotesAccum((prev) => (notesSkip === 0 ? notesPage.items : appendUnique(prev, notesPage.items)))
    }
    setNotesSkip((prev) => prev + PAGE_SIZE)
  }

  const handleSaveNote = async (leadId: string, text: string, kind?: string) => {
    try {
      if (kind === 'guest_message') {
        await patchNote({ id: leadId, body: { privateNotes: text } }).unwrap()
      } else {
        await patchSave({ id: leadId, body: { privateNotes: text } }).unwrap()
      }
      notify.info('Private note saved.')
    } catch {
      notify.error('Failed to save note.')
    }
  }

  const handleSendReply = async (
    lead: { id: string; kind?: string; fullName?: string; name?: string },
    text: string
  ) => {
    try {
      if (lead.kind === 'guest_message') {
        await patchNote({ id: lead.id, body: { lastReply: text } }).unwrap()
      } else {
        await patchSave({ id: lead.id, body: { lastReply: text } }).unwrap()
      }
      notify.info(`Urgent reply sent to ${lead.fullName || lead.name || 'guest'}.`)
    } catch {
      notify.error('Failed to send reply.')
    }
  }

  return (
    <div className="animate-in fade-in mx-auto w-full max-w-7xl min-w-0 space-y-6 overflow-x-hidden p-4 duration-500 sm:space-y-8 sm:p-6 md:p-10">
      <div className="min-w-0 border-b border-slate-100 pb-6 dark:border-white/5">
        <h1 className="flex items-start gap-3 text-xl font-black tracking-tight text-slate-950 sm:items-center sm:text-2xl dark:text-white">
          <Users className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600 sm:mt-0 sm:h-7 sm:w-7 dark:text-emerald-400" />
          <span className="wrap-break-word">Master Contact Saves</span>
        </h1>
        <p className="mt-1 text-xs font-semibold wrap-break-word text-slate-400 md:text-sm">
          Platform-wide guest saves — admin note/message replies notify single and corporate owners.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0b0f19]">
          <div className="flex items-center justify-between">
            {statsLoading ? (
              <Skeleton className="h-2.5 w-28 rounded-md" />
            ) : (
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Total Contact Saves
              </span>
            )}
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Users className="h-4 w-4" />
            </span>
          </div>
          {statsLoading ? (
            <Skeleton className="mt-3 h-9 w-16 rounded-lg" />
          ) : (
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{totalSaves.toLocaleString()}</p>
          )}
          {statsLoading ? (
            <Skeleton className="mt-2 h-3 w-40 rounded-md" />
          ) : (
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Synced across all vCards
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0b0f19]">
          <div className="flex items-center justify-between">
            {statsLoading ? (
              <Skeleton className="h-2.5 w-28 rounded-md" />
            ) : (
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Lead Notes</span>
            )}
            <span className="rounded-xl bg-rose-50 p-2 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <MessageCircle className="h-4 w-4" />
            </span>
          </div>
          {statsLoading ? (
            <Skeleton className="mt-3 h-9 w-12 rounded-lg" />
          ) : (
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{totalNotes.toLocaleString()}</p>
          )}
          {statsLoading ? (
            <Skeleton className="mt-2 h-3 w-36 rounded-md" />
          ) : (
            <p className="mt-1 text-xs font-semibold text-slate-400">Guest messages / notes</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0b0f19]">
          <div className="flex items-center justify-between">
            {statsLoading ? (
              <Skeleton className="h-2.5 w-36 rounded-md" />
            ) : (
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Active Source Profiles
              </span>
            )}
            <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Building className="h-4 w-4" />
            </span>
          </div>
          {statsLoading ? (
            <Skeleton className="mt-3 h-9 w-12 rounded-lg" />
          ) : (
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{sourceCards.toLocaleString()}</p>
          )}
          {statsLoading ? (
            <Skeleton className="mt-2 h-3 w-36 rounded-md" />
          ) : (
            <p className="mt-1 text-xs font-semibold text-slate-400">Cards generating saves</p>
          )}
        </div>
      </div>

      <div className="max-w-full min-w-0 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f15]">
        <div className="min-w-0 border-b border-slate-100 px-3 pt-4 sm:px-6 dark:border-white/5">
          <div className="flex w-full min-w-0 gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setTab('saves')}
              className={cn(
                'min-w-0 flex-1 rounded-xl px-2 py-2.5 text-[10px] font-black tracking-wider uppercase transition-all sm:px-4 sm:text-[11px]',
                tab === 'saves'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-300'
                  : 'text-slate-500'
              )}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <Save className="h-3.5 w-3.5 shrink-0" />{' '}
                <span className="truncate">Saves ({totalSaves.toLocaleString()})</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTab('notes')}
              className={cn(
                'min-w-0 flex-1 rounded-xl px-2 py-2.5 text-[10px] font-black tracking-wider uppercase transition-all sm:px-4 sm:text-[11px]',
                tab === 'notes'
                  ? 'bg-white text-rose-600 shadow-sm dark:bg-slate-800 dark:text-rose-300'
                  : 'text-slate-500'
              )}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 shrink-0" />{' '}
                <span className="truncate">Notes ({totalNotes.toLocaleString()})</span>
              </span>
            </button>
          </div>
        </div>
        <div className="min-w-0 overflow-x-hidden p-2 sm:p-4">
          {tab === 'saves' ? (
            <ContactSavesPanel
              role="admin"
              title="All Guest Contact Saves"
              className="border-0 shadow-none"
              records={saves}
              loading={savesLoading && savesSkip === 0}
              totalCount={listTotalSaves}
              hasMore={savesHasMore}
              loadingMore={savesFetching && savesSkip > 0}
              onLoadMore={loadMoreSaves}
              searchValue={savesSearch}
              onSearchChange={(value) => {
                setSavesSearch(value)
                setSavesSkip(0)
                setSavesAccum([])
                setOmittedSaveIds([])
              }}
              onDelete={handleDeleteSave}
            />
          ) : (
            <LeadNotesRepliesPanel
              role="admin"
              guestOnly={notes}
              loading={notesLoading && notesSkip === 0}
              totalCount={listTotalNotes}
              hasMore={notesHasMore}
              loadingMore={notesFetching && notesSkip > 0}
              onLoadMore={loadMoreNotes}
              searchValue={notesSearch}
              onSearchChange={(value) => {
                setNotesSearch(value)
                setNotesSkip(0)
                setNotesAccum([])
              }}
              onSaveNote={(leadId, text, lead) => handleSaveNote(leadId, text, lead?.kind)}
              onSendReply={(lead, text) => handleSendReply(lead, text)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
