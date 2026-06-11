import { cn } from '@/lib/utils'

export default function Table({ columns, data = [], loading, emptyMsg = 'No records found.' }) {
  return (
    <div className="table-wrapper">
      <table className="w-full bg-white dark:bg-slate-800">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700">
            {columns.map((col) => (
              <th key={col.key} className={cn('table-head', col.headerClass)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="table-row">
                {columns.map((col) => (
                  <td key={col.key} className="table-cell">
                    <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" style={{ width: `${60 + Math.random()*30}%` }} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-16 text-sm text-gray-400">
                {emptyMsg}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id || i} className="table-row">
                {columns.map((col) => (
                  <td key={col.key} className={cn('table-cell', col.cellClass)}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
