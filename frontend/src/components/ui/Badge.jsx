import { cn } from '@/lib/utils'

export default function Badge({ label, color = 'bg-gray-100 text-gray-600', className }) {
  return (
    <span className={cn('badge', color, className)}>
      {label}
    </span>
  )
}
