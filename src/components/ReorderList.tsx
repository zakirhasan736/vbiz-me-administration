'use client'

import { cn } from '@/utils/cn'
import { reorderByIndex } from '@/utils/reorderByIndex'
import type { DragEvent, HTMLAttributes, ReactNode } from 'react'

export type DragHandleProps = Pick<
  HTMLAttributes<HTMLElement>,
  'draggable' | 'onDragStart' | 'title' | 'aria-label' | 'className'
>

type Props<T> = {
  items: T[]
  getKey: (item: T, index: number) => string | number
  onReorder: (next: T[]) => void
  renderItem: (item: T, index: number, dragHandleProps: DragHandleProps) => ReactNode
  className?: string
}

/** Handle-only HTML5 drag-and-drop for multi-entry editors (fields stay selectable). */
export function ReorderList<T>({ items, getKey, onReorder, renderItem, className }: Props<T>) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return
    onReorder(reorderByIndex(items, from, to))
  }

  const dragHandlePropsFor = (index: number): DragHandleProps => ({
    draggable: true,
    title: 'Drag to reorder',
    'aria-label': 'Drag to reorder',
    className: 'cursor-grab active:cursor-grabbing',
    onDragStart: (e: DragEvent) => {
      e.dataTransfer.setData('text/plain', String(index))
      e.dataTransfer.effectAllowed = 'move'
    },
  })

  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item, index) => (
        <div
          key={getKey(item, index)}
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
          {renderItem(item, index, dragHandlePropsFor(index))}
        </div>
      ))}
    </div>
  )
}
