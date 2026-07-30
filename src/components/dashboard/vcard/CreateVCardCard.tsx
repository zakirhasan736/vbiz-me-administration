import { Card, CardDescription, CardTitle } from '@/components/ui'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export function CreateVCardCard() {
  return (
    <Link href="/vcards/create/home" className="block min-h-100">
      <Card className="hover:border-primary-500/30 group flex min-h-100 cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed bg-slate-50 shadow-none transition-all hover:bg-slate-100 dark:bg-[#070a13] dark:hover:bg-white/2">
        <div className="group-hover:bg-primary-500 group-hover:border-primary-500 group-hover:shadow-primary-500/20 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 group-hover:text-white dark:border-white/10 dark:bg-[#0b0f19]">
          <Plus className="h-8 w-8" strokeWidth={2.5} />
        </div>
        <CardTitle className="text-[17px]">Create New vCard</CardTitle>
        <CardDescription className="mt-1 max-w-50 text-center">
          Set up a new digital identity in seconds.
        </CardDescription>
      </Card>
    </Link>
  )
}
