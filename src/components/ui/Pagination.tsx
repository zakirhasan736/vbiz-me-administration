'use client'

import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type PaginationProps = {
  page: number
  onPageChange: (page: number) => void
  className?: string
  siblingCount?: number
  /** Pass directly, or derive via `total` + `pageSize`. */
  totalPages?: number
  /** Total item count from the API. Used with `pageSize` when `totalPages` is omitted. */
  total?: number
  /** Page size (limit). Used with `total` when `totalPages` is omitted. */
  pageSize?: number
}

function resolveTotalPages(totalPages: number | undefined, total: number | undefined, pageSize: number | undefined) {
  if (typeof totalPages === 'number' && Number.isFinite(totalPages)) {
    return Math.max(0, Math.floor(totalPages))
  }
  if (typeof total === 'number' && typeof pageSize === 'number' && pageSize > 0) {
    return Math.max(0, Math.ceil(total / pageSize))
  }
  return 0
}

function getPageNumbers(page: number, totalPages: number, siblingCount: number) {
  const pages: Array<number | 'ellipsis'> = []
  const start = Math.max(2, page - siblingCount)
  const end = Math.min(totalPages - 1, page + siblingCount)

  pages.push(1)
  if (start > 2) pages.push('ellipsis')
  for (let i = start; i <= end; i += 1) pages.push(i)
  if (end < totalPages - 1) pages.push('ellipsis')
  if (totalPages > 1) pages.push(totalPages)

  return pages
}

export function Pagination({
  page,
  totalPages: totalPagesProp,
  total,
  pageSize,
  onPageChange,
  className,
  siblingCount = 1,
}: PaginationProps) {
  const totalPages = resolveTotalPages(totalPagesProp, total, pageSize)
  if (totalPages <= 1) return null

  const pages = getPageNumbers(page, totalPages, siblingCount)

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center gap-1.5', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-1 text-[12px] font-medium text-slate-400">
            …
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            variant={item === page ? 'primary' : 'ghost'}
            size="sm"
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onPageChange(item)}
            className="min-w-9"
          >
            {item}
          </Button>
        )
      )}

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="h-9 w-9"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}
