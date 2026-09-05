import { RequestOneOnOneGuestView } from '@/components/public/RequestOneOnOneGuestView'
import { Suspense } from 'react'

export const metadata = {
  title: '1-on-1 meeting details',
  description: 'Your scheduled 1-on-1 meeting details and join link',
}

const Page = () => {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading…</div>}>
      <RequestOneOnOneGuestView />
    </Suspense>
  )
}

export default Page
