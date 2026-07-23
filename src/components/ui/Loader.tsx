import { cn } from '@/utils/cn'
import { Loader2 } from 'lucide-react'

const Loader = ({ className }: { className?: string }) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
    </div>
  )
}

export default Loader
