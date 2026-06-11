import { cn } from '@/lib/utils'

const variants = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
}

export default function Button({ children, variant = 'primary', className, size, ...props }) {
  return (
    <button className={cn(variants[variant], size === 'sm' && 'px-3 py-1.5 text-xs', className)} {...props}>
      {children}
    </button>
  )
}
