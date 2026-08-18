import { cn } from '@/utils/cn'
import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from 'react'

type TableProps = HTMLAttributes<HTMLTableElement> & {
  wrapperClassName?: string
}

export const Table = forwardRef<HTMLTableElement, TableProps>(({ className, wrapperClassName, ...props }, ref) => (
  <div className={cn('w-full max-w-full min-w-0 overflow-x-auto', wrapperClassName)}>
    <table
      ref={ref}
      className={cn('w-full caption-bottom border-collapse text-left text-[13px]', className)}
      {...props}
    />
  </div>
))
Table.displayName = 'Table'

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
)
TableHeader.displayName = 'TableHeader'

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
)
TableBody.displayName = 'TableBody'

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-slate-100 transition-colors hover:bg-slate-50/80 dark:border-white/5 dark:hover:bg-white/2',
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = 'TableRow'

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-10 px-4 text-left align-middle text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400',
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = 'TableHead'

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('px-4 py-3 align-middle text-slate-700 dark:text-slate-200', className)} {...props} />
  )
)
TableCell.displayName = 'TableCell'
