'use client'

import { cn } from '@/utils/cn'
import { reorderByIndex } from '@/utils/reorderByIndex'
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'

type Props<T> = {
  items: T[]
  getKey: (item: T, index: number) => string | number
  onReorder: (next: T[]) => void
  renderItem: (item: T, index: number, controls: ReactNode) => ReactNode
  className?: string
}

/** HTML5 drag + up/down controls for multi-entry editors */
export function ReorderList<T>({ items, getKey, onReorder, renderItem, className }: Props<T>) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return
    onReorder(reorderByIndex(items, from, to))
  }

  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item, index) => {
        const controls = (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              title="Move up"
              disabled={index === 0}
              onClick={() => move(index, index - 1)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Move down"
              disabled={index === items.length - 1}
              onClick={() => move(index, index + 1)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <span
              draggable
              title="Drag to reorder"
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(index))
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const from = Number(e.dataTransfer.getData('text/plain'))
                if (!Number.isNaN(from)) move(from, index)
              }}
              className="cursor-grab rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing dark:hover:bg-white/10 dark:hover:text-white"
            >
              <GripVertical className="h-4 w-4" />
            </span>
          </div>
        )

        return (
          <div
            key={getKey(item, index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const from = Number(e.dataTransfer.getData('text/plain'))
              if (!Number.isNaN(from)) move(from, index)
            }}
          >
            {renderItem(item, index, controls)}
          </div>
        )
      })}
    </div>
  )
}
