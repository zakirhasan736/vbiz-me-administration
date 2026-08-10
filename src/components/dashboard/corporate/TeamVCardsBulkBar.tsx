'use client'

import { ConfirmModal } from '@/components/ConfirmModal'
import { exportCardsJson } from '@/lib/corporateExport'
import { notify } from '@/lib/toast/toast'
import { useDeleteProfileMutation } from '@/redux/features/profiles/profiles.api'
import type { VCardRecord } from '@/types/vcard'
import { Download, Trash2, X } from 'lucide-react'
import { useState } from 'react'

type TeamVCardsBulkBarProps = {
  selectedIds: string[]
  cards: VCardRecord[]
  onClear: () => void
  onBulkStatus: (active: boolean) => Promise<void>
  onDeleted: () => void
}

export function TeamVCardsBulkBar({ selectedIds, cards, onClear, onBulkStatus, onDeleted }: TeamVCardsBulkBarProps) {
  const [deleteProfile] = useDeleteProfileMutation()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  if (selectedIds.length === 0) return null

  const selectedCards = cards.filter((c) => selectedIds.includes(c.id))

  const handleDelete = async () => {
    setBusy(true)
    try {
      for (const id of selectedIds) {
        await deleteProfile(id).unwrap()
      }
      setConfirmDelete(false)
      onClear()
      onDeleted()
      notify.success('Selected cards were removed successfully.')
    } catch (e) {
      const message =
        (e as { data?: { message?: string } })?.data?.message ||
        (e as Error)?.message ||
        'Could not delete all selected cards.'
      notify.error(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="border-slate-750 animate-in slide-in-from-bottom-8 fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-stretch gap-4 rounded-3xl border bg-slate-900/95 px-6 py-4 shadow-2xl backdrop-blur-md md:flex-row md:items-center dark:border-white/10 dark:bg-[#0b0f19]/95">
        <div className="flex items-center gap-3">
          <span className="bg-primary-500 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white">
            {selectedIds.length}
          </span>
          <span className="text-xs font-black tracking-wider text-slate-200 uppercase">Selected</span>
        </div>
        <div className="hidden h-4 w-px bg-slate-700 md:block" />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 rounded-xl bg-red-500/20 px-4 py-2 text-xs font-black tracking-wider text-red-400 uppercase transition-all hover:bg-red-500 hover:text-white active:scale-95"
          >
            <Trash2 className="h-4 w-4" /> Delete Selected
          </button>
          <button
            type="button"
            onClick={() => {
              exportCardsJson(selectedCards)
              onClear()
              notify.success('Exported selected cards as JSON.')
            }}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-black tracking-wider text-white uppercase transition-all hover:bg-white hover:text-slate-900 active:scale-95"
          >
            <Download className="h-4 w-4" /> Export JSON
          </button>
          <div className="border-slate-750 flex items-center gap-1.5 rounded-lg border bg-slate-800/50 p-1.5">
            <span className="mr-1.5 pl-1.5 text-[10px] font-black tracking-wider text-slate-400 uppercase">
              Status:
            </span>
            <button
              type="button"
              onClick={() => void onBulkStatus(true)}
              className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-500/30"
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => void onBulkStatus(false)}
              className="rounded-md bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-600"
            >
              Inactive
            </button>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title={`Delete ${selectedIds.length} profiles?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        isLoading={busy}
        variant="danger"
        icon={Trash2}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
