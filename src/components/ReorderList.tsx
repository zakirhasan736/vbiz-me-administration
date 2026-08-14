'use client'

import { cn } from '@/utils/cn'
import { reorderByIndex } from '@/utils/reorderByIndex'
import type { ReactNode } from 'react'

const INTERACTIVE_DRAG_BLOCKER = 'input, textarea, select, button, a, [contenteditable], [data-no-dnd]'

type Props<T> = {
  items: T[]
  getKey: (item: T, index: number) => string | number
  onReorder: (next: T[]) => void
  renderItem: (item: T, index: number) => ReactNode
  className?: string
}

/** Full-card HTML5 drag-and-drop for multi-entry editors (no up/down controls). */
export function ReorderList<T>({ items, getKey, onReorder, renderItem, className }: Props<T>) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return
    onReorder(reorderByIndex(items, from, to))
  }

  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item, index) => (
        <div
          key={getKey(item, index)}
          draggable
          title="Drag to reorder"
          className="cursor-grab active:cursor-grabbing"
          onDragStart={(e) => {
            const target = e.target as HTMLElement | null
            if (target?.closest?.(INTERACTIVE_DRAG_BLOCKER)) {
              e.preventDefault()
              return
            }
            e.dataTransfer.setData('text/plain', String(index))
            e.dataTransfer.effectAllowed = 'move'
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
          }}
          onDrop={(e) => {
            e.preventDefault()
            const from = Number(e.dataTransfer.getData('text/plain'))
            if (!Number.isNaN(from)) move(from, index)
          }}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}
