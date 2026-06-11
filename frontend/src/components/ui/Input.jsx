import { cn } from '@/lib/utils'

export default function Input({ label, error, className, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input className={cn('input', error && 'border-red-400 focus:ring-red-400', className)} {...props} />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select className={cn('input', error && 'border-red-400', className)} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <textarea className={cn('input resize-none', error && 'border-red-400', className)} rows={3} {...props} />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
