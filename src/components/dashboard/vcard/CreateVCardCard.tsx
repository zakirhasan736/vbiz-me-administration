import { Card, CardDescription, CardTitle } from '@/components/ui'
import { CreateCardLauncher } from '@/components/vcard/create-agent/CreateCardLauncher'
import { Lock, Plus } from 'lucide-react'

type CreateVCardCardProps = {
  canCreate?: boolean
  limitReachedMessage?: string
}

export function CreateVCardCard({
  canCreate = true,
  limitReachedMessage = 'Single card owners can create only one vCard',
}: CreateVCardCardProps) {
  if (!canCreate) {
    return (
      <Card className="flex min-h-100 flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-violet-200/80 bg-violet-50/40 shadow-none dark:border-violet-500/20 dark:bg-violet-500/5">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-200 bg-white text-violet-500 shadow-sm dark:border-violet-500/20 dark:bg-[#0b0f19] dark:text-violet-300">
          <Lock className="h-7 w-7" strokeWidth={2.25} />
        </div>
        <CardTitle className="text-[17px]">1 Card Limit Reached</CardTitle>
        <CardDescription className="mt-1 max-w-50 text-center">{limitReachedMessage}</CardDescription>
      </Card>
    )
  }

  return (
    <CreateCardLauncher>
      {(open) => (
        <button type="button" onClick={open} className="block min-h-100 w-full text-left">
          <Card className="hover:border-primary-500/30 group flex min-h-100 cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed bg-slate-50 shadow-none transition-all hover:bg-slate-100 dark:bg-[#070a13] dark:hover:bg-white/2">
            <div className="group-hover:bg-primary-500 group-hover:border-primary-500 group-hover:shadow-primary-500/20 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 group-hover:text-white dark:border-white/10 dark:bg-[#0b0f19]">
              <Plus className="h-8 w-8" strokeWidth={2.5} />
            </div>
            <CardTitle className="text-[17px]">Create New vCard</CardTitle>
            <CardDescription className="mt-1 max-w-50 text-center">
              AI-assisted or manual — set up a digital identity in seconds.
            </CardDescription>
          </Card>
        </button>
      )}
    </CreateCardLauncher>
  )
}
