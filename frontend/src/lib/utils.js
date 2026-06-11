import { clsx } from 'clsx'

export function cn(...inputs) { return clsx(inputs) }

export const fmt = {
  currency: (v) => v == null ? '—' : `₹${Number(v).toLocaleString('en-IN')}`,
  lakhs:    (v) => v == null ? '—' : `₹${(Number(v)/100000).toFixed(2)}L`,
  crores:   (v) => v == null ? '—' : `₹${(Number(v)/10000000).toFixed(2)} Cr`,
  date:     (v) => v ? new Date(v).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—',
  shortDate:(v) => v ? new Date(v).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : '—',
  number:   (v) => v == null ? '—' : Number(v).toLocaleString('en-IN'),
  percent:  (v) => v == null ? '—' : `${v}%`,
}

export function getStatusMeta(statusList, value) {
  return statusList.find(s => s.value === value) || { label: value, color: 'bg-gray-100 text-gray-600' }
}

export function debounce(fn, ms = 300) {
  let timer
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms) }
}
