import { Badge, Card, Pagination, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { Activity, TrendingUp } from 'lucide-react'

export type EngagementRow = {
  id: string
  event: string
  viewer: string
  time: string
  platform: string
}

type RecentEngagementTableProps = {
  rows?: EngagementRow[]
  page?: number
  total?: number
  pageSize?: number
  onPageChange?: (page: number) => void
}

export function RecentEngagementTable({
  rows = [],
  page = 1,
  total = 0,
  pageSize = 10,
  onPageChange,
}: RecentEngagementTableProps) {
  return (
    <Card className="mb-10 min-w-0 overflow-hidden rounded-4xl">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-6 py-8 sm:flex-row sm:items-center md:px-8 dark:border-white/5">
        <h2 className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/50 bg-slate-50 shadow-sm dark:border-white/5 dark:bg-slate-800/50">
            <Activity className="h-5 w-5 text-slate-500" />
          </span>
          Recent Engagement
        </h2>
      </div>
      <div className="min-w-0">
        <Table className="min-w-[640px]" wrapperClassName="engagement-table-scroll overscroll-x-contain">
          <TableHeader className="bg-slate-50/50 dark:bg-white/2">
            <TableRow className="border-0 hover:bg-transparent dark:hover:bg-transparent">
              <TableHead className="px-8 tracking-widest whitespace-nowrap">Event</TableHead>
              <TableHead className="px-8 tracking-widest whitespace-nowrap">Viewer</TableHead>
              <TableHead className="px-8 tracking-widest whitespace-nowrap">Time</TableHead>
              <TableHead className="px-8 text-right tracking-widest whitespace-nowrap">Platform</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
            {rows.length === 0 ? (
              <TableRow className="border-0 hover:bg-transparent dark:hover:bg-transparent">
                <TableCell colSpan={4} className="px-8 py-10 text-center text-sm font-medium text-slate-500">
                  No recent engagement yet. Activity will appear when visitors view your cards.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group cursor-default border-0 hover:bg-slate-50/80 dark:hover:bg-[#121827]"
                >
                  <TableCell className="flex items-center gap-4 px-8 py-5 font-bold whitespace-nowrap text-slate-900 dark:text-slate-200">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-transform group-hover:scale-110 dark:bg-sky-500/10 dark:text-sky-400">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    {row.event}
                  </TableCell>
                  <TableCell className="px-8 py-5 font-semibold whitespace-nowrap text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      {row.viewer !== 'Guest' ? (
                        <div className="bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                          {row.viewer.charAt(0)}
                        </div>
                      ) : (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-slate-800">
                          G
                        </div>
                      )}
                      {row.viewer}
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-[13px] font-medium whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {row.time}
                  </TableCell>
                  <TableCell className="px-8 py-5 text-right font-medium whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className="group-hover:border-primary-500/30 group-hover:text-primary-600 dark:group-hover:text-primary-400 rounded-[10px] bg-white px-3 py-1.5 text-[11px] tracking-wider uppercase shadow-sm dark:bg-slate-800"
                    >
                      {row.platform}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {onPageChange ? (
        <div className="border-t border-slate-100 px-6 py-4 md:px-8 dark:border-white/5">
          <Pagination page={page} total={total} pageSize={pageSize} onPageChange={onPageChange} />
        </div>
      ) : null}
    </Card>
  )
}
