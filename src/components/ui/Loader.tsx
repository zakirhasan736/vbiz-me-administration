import { cn } from '@/utils/cn'
import { Loader2 } from 'lucide-react'

type LoaderProps = {
  className?: string
  iconClassName?: string
}

export function Loader({ className, iconClassName }: LoaderProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn('h-4 w-4 animate-spin', iconClassName)} />
    </div>
  )
}

export default Loader
