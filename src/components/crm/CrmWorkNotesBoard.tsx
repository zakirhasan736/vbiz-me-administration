'use client'

import { ModalPortal } from '@/components/ModalPortal'
import { Tooltip } from '@/components/ui'
import { Skeleton } from '@/components/ui/Skeleton'
import { notify } from '@/lib/toast/toast'
import {
  useCreateCrmWorkNoteMutation,
  useDeleteCrmWorkNoteMutation,
  useGetCrmWorkNotesQuery,
  useReorderCrmWorkNotesMutation,
  useUpdateCrmWorkNoteMutation,
  type WorkNoteRow,
  type WorkNoteStatus,
} from '@/redux/features/crm/crm.api'
import { cn } from '@/utils/cn'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertTriangle, Loader2, Plus, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

const COLUMNS: { id: WorkNoteStatus; label: string }[] = [
  { id: 'not_started', label: 'Pending' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'in_review', label: 'In review' },
  { id: 'complete', label: 'Complete' },
]

function formatWhen(iso: string | null) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function toDatetimeLocalValue(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocalValue(value: string) {
  if (!value.trim()) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function isColumnId(id: string): id is WorkNoteStatus {
  return COLUMNS.some((column) => column.id === id)
}

function emptyByStatus(): Record<WorkNoteStatus, WorkNoteRow[]> {
  return {
    not_started: [],
    in_progress: [],
    in_review: [],
    complete: [],
  }
}

function groupByStatus(notes: WorkNoteRow[]) {
  const map = emptyByStatus()
  for (const note of notes) {
    map[note.status]?.push(note)
  }
  return map
}

function flattenBoard(map: Record<WorkNoteStatus, WorkNoteRow[]>) {
  return COLUMNS.flatMap((column) => map[column.id])
}

function findColumn(id: string, notes: WorkNoteRow[]): WorkNoteStatus | null {
  if (isColumnId(id)) return id
  return notes.find((note) => note.id === id)?.status ?? null
}

function sortNotes(notes: WorkNoteRow[]) {
  const grouped = groupByStatus(notes)
  for (const column of COLUMNS) {
    grouped[column.id].sort((a, b) => {
      const order = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      if (order !== 0) return order
      return b.createdAt.localeCompare(a.createdAt)
    })
  }
  return flattenBoard(grouped)
}

function applyOrder(notes: WorkNoteRow[]) {
  const grouped = groupByStatus(notes)
  for (const column of COLUMNS) {
    grouped[column.id] = grouped[column.id].map((note, index) =>
      note.sortOrder === index && note.status === column.id ? note : { ...note, status: column.id, sortOrder: index }
    )
  }
  return flattenBoard(grouped)
}

export function CrmWorkNotesBoard() {
  const { data, isLoading, isError, error } = useGetCrmWorkNotesQuery({ limit: 200 })
  const [updateNote, { isLoading: updating }] = useUpdateCrmWorkNoteMutation()
  const [createNote, { isLoading: creating }] = useCreateCrmWorkNoteMutation()
  const [deleteNote, { isLoading: deleting }] = useDeleteCrmWorkNoteMutation()
  const [reorderNotes] = useReorderCrmWorkNotesMutation()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [selected, setSelected] = useState<WorkNoteRow | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [boardNotes, setBoardNotes] = useState<WorkNoteRow[]>([])
  const boardNotesRef = useRef<WorkNoteRow[]>([])
  const dragSnapshot = useRef<WorkNoteRow[] | null>(null)
  const orderPendingRef = useRef(false)

  const commitBoardNotes = (next: WorkNoteRow[]) => {
    boardNotesRef.current = next
    setBoardNotes(next)
  }

  useEffect(() => {
    if (activeId || orderPendingRef.current) return
    commitBoardNotes(sortNotes(data?.items ?? []))
  }, [data?.items, activeId])

  const byStatus = useMemo(() => groupByStatus(boardNotes), [boardNotes])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const activeNote = boardNotes.find((n) => n.id === activeId) || null

  const onDragStart = (event: DragStartEvent) => {
    dragSnapshot.current = boardNotesRef.current
    setActiveId(String(event.active.id))
  }

  const onDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null
    if (!overId) return

    const activeNoteId = String(event.active.id)
    const current = boardNotesRef.current
    const fromStatus = findColumn(activeNoteId, current)
    const toStatus = findColumn(overId, current)
    if (!fromStatus || !toStatus || fromStatus === toStatus) return

    const grouped = groupByStatus(current)
    const fromItems = grouped[fromStatus]
    const activeIndex = fromItems.findIndex((note) => note.id === activeNoteId)
    if (activeIndex < 0) return

    const [moved] = fromItems.splice(activeIndex, 1)
    const toItems = grouped[toStatus]
    const overIndex = isColumnId(overId) ? toItems.length : toItems.findIndex((note) => note.id === overId)
    const insertAt = overIndex < 0 ? toItems.length : overIndex
    toItems.splice(insertAt, 0, { ...moved, status: toStatus })
    grouped[fromStatus] = fromItems
    grouped[toStatus] = toItems
    commitBoardNotes(flattenBoard(grouped))
  }

  const onDragEnd = async (event: DragEndEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null
    const origin = dragSnapshot.current
    dragSnapshot.current = null

    if (!overId || !origin) {
      if (origin) commitBoardNotes(origin)
      setActiveId(null)
      return
    }

    let working = boardNotesRef.current
    const activeNoteId = String(event.active.id)
    const fromStatus = findColumn(activeNoteId, origin)
    const toStatus = findColumn(overId, working)
    if (fromStatus && toStatus && fromStatus === toStatus) {
      const items = groupByStatus(origin)[fromStatus]
      const oldIndex = items.findIndex((note) => note.id === activeNoteId)
      const newIndex = isColumnId(overId) ? items.length - 1 : items.findIndex((note) => note.id === overId)
      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        const grouped = groupByStatus(origin)
        grouped[fromStatus] = arrayMove(items, oldIndex, newIndex)
        working = flattenBoard(grouped)
      } else {
        working = origin
      }
    }

    const nextNotes = applyOrder(working)
    commitBoardNotes(nextNotes)

    const changed = nextNotes.filter((note) => {
      const previous = origin.find((item) => item.id === note.id)
      return !previous || previous.status !== note.status || (previous.sortOrder ?? 0) !== (note.sortOrder ?? 0)
    })

    if (!changed.length) {
      setActiveId(null)
      return
    }

    const affectedStatuses = new Set(changed.map((note) => note.status))
    const originStatuses = new Set(
      origin.filter((note) => changed.some((item) => item.id === note.id)).map((note) => note.status)
    )
    for (const status of originStatuses) affectedStatuses.add(status)

    orderPendingRef.current = true
    setActiveId(null)

    try {
      await reorderNotes({
        items: nextNotes
          .filter((note) => affectedStatuses.has(note.status))
          .map((note) => ({
            id: note.id,
            status: note.status,
            sortOrder: note.sortOrder ?? 0,
          })),
      }).unwrap()
      const moved = nextNotes.find((note) => note.id === activeNoteId)
      const previous = origin.find((note) => note.id === moved?.id)
      if (moved && previous && moved.status !== previous.status) {
        notify.info(`Moved to ${COLUMNS.find((c) => c.id === moved.status)?.label || moved.status}`)
      }
    } catch {
      commitBoardNotes(origin)
      notify.error('Couldn’t update note order.')
    } finally {
      orderPendingRef.current = false
    }
  }

  const onDragCancel = () => {
    if (dragSnapshot.current) commitBoardNotes(dragSnapshot.current)
    dragSnapshot.current = null
    setActiveId(null)
  }

  const handleCreate = async (payload: {
    title: string
    description: string
    dueAt: string | null
    startsAt: string | null
  }) => {
    if (!payload.startsAt || !payload.dueAt) {
      notify.error('Start and due dates are required.')
      return
    }
    await createNote({
      title: payload.title,
      description: payload.description || undefined,
      dueAt: payload.dueAt,
      startsAt: payload.startsAt,
      status: 'not_started',
    }).unwrap()
    notify.info('Note created')
    setCreateOpen(false)
  }

  const handleSaveDetail = async (payload: {
    title: string
    description: string
    status: WorkNoteStatus
    dueAt: string | null
    startsAt: string | null
  }) => {
    if (!selected) return
    if (!payload.startsAt || !payload.dueAt) {
      notify.error('Start and due dates are required.')
      return
    }
    await updateNote({
      id: selected.id,
      body: {
        title: payload.title,
        description: payload.description,
        status: payload.status,
        dueAt: payload.dueAt,
        startsAt: payload.startsAt,
      },
    }).unwrap()
    setSelected(null)
    notify.info('Note saved')
  }

  const handleDelete = async () => {
    if (!selected) return
    await deleteNote(selected.id).unwrap()
    notify.info('Note deleted')
    setSelected(null)
  }

  if (isError) {
    const message =
      error && typeof error === 'object' && 'data' in error
        ? String((error as { data?: { message?: string } }).data?.message || '')
        : ''
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-10 text-sm font-semibold text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
        {message || 'Couldn’t load notes.'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-500">
          Drag cards up or down to reorder a column, or across columns to update status. Click a card for details, due
          dates, and reminders.
        </p>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-[11px] font-black tracking-wider text-white uppercase dark:bg-indigo-500"
        >
          <Plus className="h-4 w-4" /> Add note
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={(e) => void onDragEnd(e)}
          onDragCancel={onDragCancel}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                label={column.label}
                notes={byStatus[column.id]}
                onOpen={setSelected}
              />
            ))}
          </div>
          <DragOverlay>{activeNote ? <NoteCard note={activeNote} dragging /> : null}</DragOverlay>
        </DndContext>
      )}

      {createOpen ? (
        <WorkNoteFormModal
          title="New note"
          submitLabel="Create"
          isSubmitting={creating}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      ) : null}

      {selected ? (
        <WorkNoteDetailModal
          note={selected}
          isSubmitting={updating || deleting}
          onClose={() => setSelected(null)}
          onSave={handleSaveDetail}
          onDelete={() => void handleDelete()}
        />
      ) : null}
    </div>
  )
}

function KanbanColumn({
  id,
  label,
  notes,
  onOpen,
}: {
  id: WorkNoteStatus
  label: string
  notes: WorkNoteRow[]
  onOpen: (note: WorkNoteRow) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-80 flex-col rounded-3xl border bg-slate-50/80 p-3 dark:bg-white/5',
        isOver ? 'border-indigo-400 dark:border-indigo-400' : 'border-slate-200/80 dark:border-white/10'
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-[11px] font-black tracking-wider text-slate-600 uppercase dark:text-slate-300">{label}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-900">
          {notes.length}
        </span>
      </div>
      <SortableContext items={notes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2">
          {notes.map((note) => (
            <SortableNote key={note.id} note={note} onOpen={() => onOpen(note)} />
          ))}
          {notes.length === 0 ? (
            <div className="flex min-h-24 flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-[11px] font-semibold text-slate-400 dark:border-white/10">
              Drop here
            </div>
          ) : null}
        </div>
      </SortableContext>
    </div>
  )
}

function SortableNote({ note, onOpen }: { note: WorkNoteRow; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
  })
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <NoteCard note={note} onClick={onOpen} />
    </div>
  )
}

function NoteCard({ note, onClick, dragging }: { note: WorkNoteRow; onClick?: () => void; dragging?: boolean }) {
  const showOverdueWarning = note.status === 'not_started' && note.isOverdue

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={cn(
        'relative w-full cursor-grab rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm active:cursor-grabbing dark:border-white/10 dark:bg-[#0d121c]',
        onClick && 'outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
        dragging && 'shadow-lg ring-2 ring-indigo-400',
        note.isOverdue && 'border-rose-300 dark:border-rose-500/40'
      )}
    >
      <p className="text-sm font-bold text-slate-900 dark:text-white">{note.title}</p>
      {note.description ? (
        <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500">{note.description}</p>
      ) : null}
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-2 text-[10px] font-semibold text-slate-400">
          {note.assigneeName ? <span>{note.assigneeName}</span> : null}
          {note.dueAt ? (
            <span className={note.isOverdue ? 'text-rose-600' : ''}>Due {formatWhen(note.dueAt)}</span>
          ) : null}
        </div>
        {showOverdueWarning ? (
          <Tooltip content="Due date has passed" side="top">
            <span
              role="img"
              aria-label="Due date has passed"
              className="inline-flex shrink-0 rounded-md p-0.5 text-amber-600 outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:text-amber-400"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
          </Tooltip>
        ) : null}
      </div>
    </div>
  )
}

function WorkNoteFormModal({
  title,
  submitLabel,
  isSubmitting,
  initial,
  onClose,
  onSubmit,
}: {
  title: string
  submitLabel: string
  isSubmitting?: boolean
  initial?: { title: string; description: string; dueAt: string; startsAt: string }
  onClose: () => void
  onSubmit: (payload: {
    title: string
    description: string
    dueAt: string | null
    startsAt: string | null
  }) => Promise<void>
}) {
  const [noteTitle, setNoteTitle] = useState(initial?.title || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [dueAt, setDueAt] = useState(initial?.dueAt || '')
  const [startsAt, setStartsAt] = useState(initial?.startsAt || '')

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-200 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="absolute inset-0 bg-slate-950/50" onClick={onClose} />
        <form
          className="relative w-full max-w-lg rounded-t-[28px] border border-slate-200 bg-white sm:rounded-[28px] dark:border-white/10 dark:bg-[#0b1018]"
          onSubmit={(e) => {
            e.preventDefault()
            void onSubmit({
              title: noteTitle.trim(),
              description: description.trim(),
              dueAt: fromDatetimeLocalValue(dueAt),
              startsAt: fromDatetimeLocalValue(startsAt),
            }).catch(() => notify.error('Couldn’t save note'))
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/5">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4 px-5 py-5">
            <label className="block space-y-1">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Title</span>
              <input
                required
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Start</span>
                <input
                  type="datetime-local"
                  required
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Due</span>
                <input
                  type="datetime-local"
                  required
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
                />
              </label>
            </div>
          </div>
          <div className="border-t border-slate-100 px-5 py-4 dark:border-white/5">
            <button
              type="submit"
              disabled={!noteTitle.trim() || !startsAt.trim() || !dueAt.trim() || isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3 text-[11px] font-black tracking-wider text-white uppercase disabled:bg-slate-300 dark:bg-indigo-500"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  )
}

function WorkNoteDetailModal({
  note,
  isSubmitting,
  onClose,
  onSave,
  onDelete,
}: {
  note: WorkNoteRow
  isSubmitting?: boolean
  onClose: () => void
  onSave: (payload: {
    title: string
    description: string
    status: WorkNoteStatus
    dueAt: string | null
    startsAt: string | null
  }) => Promise<void>
  onDelete: () => void
}) {
  const [title, setTitle] = useState(note.title)
  const [description, setDescription] = useState(note.description || '')
  const [status, setStatus] = useState<WorkNoteStatus>(note.status)
  const [dueAt, setDueAt] = useState(toDatetimeLocalValue(note.dueAt))
  const [startsAt, setStartsAt] = useState(toDatetimeLocalValue(note.startsAt))

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-200 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={onClose} />
        <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[28px] border border-slate-200 bg-white shadow-2xl sm:rounded-[28px] dark:border-white/10 dark:bg-[#0b1018]">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/5">
            <div>
              <p className="text-[10px] font-black tracking-wider text-indigo-600 uppercase">Note</p>
              <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">Details</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form
            className="space-y-4 px-5 py-5"
            onSubmit={(e) => {
              e.preventDefault()
              void onSave({
                title: title.trim(),
                description: description.trim(),
                status,
                dueAt: fromDatetimeLocalValue(dueAt),
                startsAt: fromDatetimeLocalValue(startsAt),
              }).catch(() => notify.error('Couldn’t save note'))
            }}
          >
            <label className="block space-y-1">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Title</span>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as WorkNoteStatus)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
              >
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Start</span>
                <input
                  type="datetime-local"
                  required
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Due</span>
                <input
                  type="datetime-local"
                  required
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none dark:border-white/10 dark:bg-slate-900"
                />
              </label>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              Assignee: {note.assigneeName || 'You'} · Created {formatWhen(note.createdAt)}
              {note.leadRef ? ` · Lead ${note.leadRef}` : ''}
            </p>
            <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-stretch">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !startsAt.trim() || !dueAt.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3 text-[11px] font-black tracking-wider text-white uppercase disabled:bg-slate-300 dark:bg-indigo-500"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={isSubmitting}
                className="rounded-2xl border border-rose-200 px-5 py-3 text-[11px] font-black tracking-wider text-rose-700 uppercase transition hover:bg-rose-50 disabled:opacity-50 sm:min-w-30 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
              >
                Delete
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  )
}
