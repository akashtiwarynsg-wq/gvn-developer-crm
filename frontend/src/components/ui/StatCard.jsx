import { cn } from '@/lib/utils'

export default function StatCard({ icon: Icon, label, value, sub, accent = 'brand', trend }) {
  const accents = {
    brand:  'bg-brand-50 dark:bg-brand-950 text-brand-600',
    green:  'bg-green-50 dark:bg-green-950 text-green-600',
    yellow: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600',
    blue:   'bg-blue-50 dark:bg-blue-950 text-blue-600',
    purple: 'bg-purple-50 dark:bg-purple-950 text-purple-600',
    orange: 'bg-orange-50 dark:bg-orange-950 text-orange-600',
    teal:   'bg-teal-50 dark:bg-teal-950 text-teal-600',
  }
  return (
    <div className="stat-card card-hover">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', accents[accent])}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}
